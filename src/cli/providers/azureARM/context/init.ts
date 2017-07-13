import { resolvePath } from '../../../utilities/cli'
import { projectConfig } from '../../../project/config'
import { ExecuteStep } from '../../../context'

import { defaultsDeep } from 'lodash'

export const ARMInit = ExecuteStep.register('ARMInit', async (context) => {
    context.ARMConfig = {
        ...projectConfig.ARM
    }

    context.ARMTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
            "functionAppName": {
                "type": "string",
                "defaultValue": projectConfig.name,
                "metadata": {
                    "description": "The name of the function app that you wish to create."
                }
            },
            "storageAccountType": {
                "type": "string",
                "defaultValue": "Standard_LRS",
                "allowedValues": [
                    "Standard_LRS",
                    "Standard_GRS",
                    "Standard_ZRS",
                    "Premium_LRS"
                ],
                "metadata": {
                    "description": "Storage Account type"
                }
            }
        },
        "variables": {
            "functionAppName": "[parameters('functionAppName')]",
            "hostingPlanName": "[parameters('functionAppName')]",
            "storageAccountName": "[concat(uniquestring(resourceGroup().id), 'azfunctions')]",
            "storageAccountid": "[concat(resourceGroup().id,'/providers/','Microsoft.Storage/storageAccounts/', variables('storageAccountName'))]"
        },
        "resources": [
            {
                "type": "Microsoft.Storage/storageAccounts",
                "name": "[variables('storageAccountName')]",
                "apiVersion": "2015-06-15",
                "location": "[resourceGroup().location]",
                "properties": {
                    "accountType": "[parameters('storageAccountType')]"
                }
            },
            {
                "type": "Microsoft.Web/serverfarms",
                "apiVersion": "2015-04-01",
                "name": "[variables('hostingPlanName')]",
                "location": "[resourceGroup().location]",
                "properties": {
                    "name": "[variables('hostingPlanName')]",
                    "computeMode": "Dynamic",
                    "sku": "Dynamic"
                }
            },
            {
                "apiVersion": "2015-08-01",
                "type": "Microsoft.Web/sites",
                "name": "[variables('functionAppName')]",
                "location": "[resourceGroup().location]",
                "kind": "functionapp",
                "dependsOn": [
                    "[resourceId('Microsoft.Web/serverfarms', variables('hostingPlanName'))]",
                    "[resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName'))]"
                ],
                "properties": {
                    "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('hostingPlanName'))]",
                    "siteConfig": {
                        "appSettings": [
                            {
                                "name": "AzureWebJobsDashboard",
                                "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(variables('storageAccountid'),'2015-05-01-preview').key1)]"
                            },
                            {
                                "name": "AzureWebJobsStorage",
                                "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(variables('storageAccountid'),'2015-05-01-preview').key1)]"
                            },
                            {
                                "name": "FUNCTIONS_EXTENSION_VERSION",
                                "value": "~1"
                            },
                            {
                                "name": "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING",
                                "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(variables('storageAccountid'),'2015-05-01-preview').key1)]"
                            },
                            {
                                "name": "WEBSITE_CONTENTSHARE",
                                "value": "[toLower(variables('functionAppName'))]"
                            },
                            {
                                "name": "WEBSITE_NODE_DEFAULT_VERSION",
                                "value": "6.5.0"
                            }
                        ]
                    }
                },
                "resources": []
            }
        ]
    }
    context.ARMStacks = {}
    context.deploymentResources = []
})

export const ARMMerge = ExecuteStep.register('ARMAfterCreateDefaults', async (context) => {
    defaultsDeep(context.ARMTemplate, projectConfig.ARMTemplate || {})
    defaultsDeep(context.ARMStacks, projectConfig.ARMStacksTemplate || {})
})

export const initGitTemplate = (context) => {
    const { site } = context

    if (context.ARMConfig.deploymentOptions === 'git') {
        const gitUrl = context.ARMTemplate.parameters.gitUrl || {}
        context.ARMTemplate.parameters.gitUrl = {
            ...gitUrl,
            "type": "string",
            // "defaultValue": "https://github.com/borzav/azure-function-test",
            "metadata": {
                "description": "Git repository URL"
            }
        }

        const branch = context.ARMTemplate.parameters.branch || {}
        context.ARMTemplate.parameters.branch = {
            ...branch,
            "type": "string",
            // "defaultValue": "master",
            "metadata": {
                "description": "Git repository branch"
            }
        }

        context.ARMTemplate.variables.gitRepoUrl = "[parameters('gitUrl')]"
        context.ARMTemplate.variables.gitBranch = "[parameters('branch')]"

        const site = context.ARMTemplate.resources.find(r => r.type === 'Microsoft.Web/sites')
        if (site) {
            site.resources.push({
                "apiVersion": "2015-08-01",
                "name": "web",
                "type": "sourcecontrols",
                "dependsOn": [
                    "[resourceId('Microsoft.Web/Sites', parameters('functionAppName'))]"
                ],
                "properties": {
                    "RepoUrl": "[variables('gitRepoUrl')]",
                    "branch": "[variables('gitBranch')]",
                    "IsManualIntegration": true
                }
            })
        }
    }
}

export const addEnvironmentSetting = (name, value, site) => {
    const exists = site.properties.siteConfig.appSettings.find(s => s.name === name && s.value === value)
    if (!exists) {
        site.properties.siteConfig.appSettings.push({ name, value })
    }
}