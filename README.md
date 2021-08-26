# functionly

The `functionly library` lets you build `serverless` nodejs applications in an innovative, functional, and fun by abstraction way.
Use the JavaScript language and the JSON syntax to describe infrastructure and entities, service dependencies, and to implement service code. Deploy your solution to cloud providers, or run containerized on your onprem servers, or locally during development time using the `functionly CLI`.

Defining a rest service which listens on `/hello-world`:
```js
import { FunctionalService, rest, description, param } from 'functionly'

@rest({ path: '/hello-world' })
@description('hello world service')
export class HelloWorld extends FunctionalService {
    static async handle(@param name = 'world') {
        return `hello ${name}`
    }
}

export const helloworld = HelloWorld.createInvoker()
```
Running on localhost:
```sh
functionly start
```
Try it on http://localhost:3000/hello-world?name=Joe

---

- [Install from npm](#install-from-npm)
- [Getting started](#getting-started)
- [Examples](#examples)

# Install from npm:

## functionly CLI
```sh
npm install functionly -g
```

## functionly library
```sh
npm install functionly
```


# Getting started

* [Create an empty Functionly project](#create-an-empty-functionly-project)
* [Create a Hello world service](#create-a-hello-world-service)
    * [Resolve parameter values](#resolve-parameter-values)
* [Create a Todo application with DynamoDB](#create-a-tododb-application-with-dynamodb)
    * [Create a dynamo table](#create-a-dynamo-table)
    * [Read todos](#read-todos)
    * [Create todo](#create-todo)
    * *[Extend with Services](#extend-the-example-with-Services) - optional*
* [Run and Deploy with CLI](#run-and-deploy-with-cli)
* [AWS deployment](#aws-deployment)
* [Examples](#examples)

## Create an empty Functionly project
It's a simple npm project.
### Dependencies
- functionly
```sh
npm install --save functionly
```

### Dev dependencies
Functionly uses webpack with babel for compile the code.
- babel-core
- babel-loader
- babel-preset-functionly-aws
```sh
npm install --save-dev babel-core babel-loader babel-preset-functionly-aws
```

### Babel configuration
Default `.babelrc`

```js
{
    "presets": [ "functionly-aws" ]
}
```

### Functionly configuration
Default `functionly.json`
```js
{
    "awsRegion": "us-east-1",
    "main": "./src/index.js",
    "deployTarget": "aws",
    "localPort": 3000,
    "stage": "dev",
    "watch": true,
    "compile": "babel-loader"
}
```

## Create a Hello world service
We need to create a `FunctionalService` to implement the business logic of hello world application
```js
import { FunctionalService } from 'functionly'

export class HelloWorld extends FunctionalService {
    static async handle() {}
}
```
If you want your service to be accessible with a web request over a rest interface then you have to decorate  it with the [rest]() decorator. We have to set the `path` property to define the rest endpoint.
If we do not set the `methods` property that means it will accept `GET` requests. (default: `methods: ['get']`)
```js
@rest({ path: '/hello-world' })
```
Define a [description]() for the `HelloWorld`, which will make it easier to find in the AWS Lambda list.
```js
@description('hello world service')
```
Now we have to create the business logic.
```js
import { FunctionalService, rest, description } from 'functionly'

@rest({ path: '/hello-world' })
@description('hello world service')
export class HelloWorld extends FunctionalService {
    static async handle() {
        return `hello world`
    }
}
```
We are almost done, we just have to export our service from the main file.
```js
export const helloworld = HelloWorld.createInvoker()
```
### Resolve parameter values
In the `handle` method if you use the `@param` property decorator for a parameter then it resolves the value from a request context.
```js
import { FunctionalService, rest, description, param } from 'functionly'

@rest({ path: '/hello-world' })
@description('hello world service')
export class HelloWorld extends FunctionalService {
    static async handle(@param name = 'world') {
        return `hello ${name}`
    }
}

export const helloworld = HelloWorld.createInvoker()
```

## Create a TodoDB application with DynamoDB
Define a base class for FunctionalService to set basic Lambda settings in the AWS environment.
```js
import { FunctionalService, aws } from 'functionly'

@aws({ type: 'nodejs12.x', memorySize: 512, timeout: 3 })
export class TodoService extends FunctionalService { }
```

### Create a dynamo table
We need a DynamoTable, called `TodoTable` because we want to store todo items.
```js
import { DynamoTable, dynamoTable, injectable } from 'functionly'

@injectable()
@dynamo()
export class TodoTable extends DynamoTable { }
```

### Read todos
We need to create a service to read todo items.
```js
export class GetAllTodos extends TodoService {
    static async handle() {}
}
```
If you want your service to be accessible with a web request over a rest interface then you have to decorate it with the [rest]() decorator. We have to set the `path` property to define the rest endpoint.
If we do not set the `methods` property that means it will accept `GET` requests. (default: `methods: ['get']`)
```js
@rest({ path: '/getAllTodos' })
```
Define a [description]() for the `TodoService`, which will make it easier to find in the AWS Lambda list.
```js
@description('get all Todo service')
```
Now we have to create the business logic. We want to read the todo items, so we need to inject the `TodoTable`. Get the items from it and return from our service.
```js
import { rest, description, inject } from 'functionly'

@rest({ path: '/getAllTodos' })
@description('get all Todo service')
export class GetAllTodos extends TodoService {
    static async handle(@inject(TodoTable) db) {
        let items = await db.scan()
        return { ok: 1, items }
    }
}
```
We are almost done, we just have to export our service from the main file.
```js
export const getAllTodos = GetAllTodos.createInvoker()
```

### Create todo
We need a service to create todo items, so let's do this. We will also define a [rest]() endpoint and a [description]().
```js
import { rest, description } from 'functionly'

@rest({ path: '/createTodo', methods: ['post'] })
@description('create Todo service')
export class CreateTodo extends TodoService {
    static async handle() {}
}
```
We need some values to create a new todo item: `name`, `description` and `status`. Expect these with the [param]() decorator, and it will resolve them from the invocation context.
```js
import { rest, description, param } from 'functionly'

@rest({ path: '/createTodo', methods: ['post'] })
@description('create Todo service')
export class CreateTodo extends TodoService {
    static async handle(@param name, @param description, @param staus) {}
}
```
The business logic: save a new todo item. [Inject]() the `TodoTable` and save a new todo item with the `put` function. We need an id for the new todo, in the example, we'll use [shortid](https://www.npmjs.com/package/shortid) to generate them.
```js
import { generate } from 'shortid'
import { rest, description, param } from 'functionly'

@rest({ path: '/createTodo', methods: ['post'] })
@description('create Todo service')
export class CreateTodo extends TodoService {
    static async handle(@param name, @param description, @param status, @inject(TodoTable) db) {
        let item = {
            id: generate(),
            name,
            description,
            status
        }

        await db.put({ Item: item })

        return { ok: 1, item }
    }
}

export const createTodo = CreateTodo.createInvoker()
```

## Extend the example with Services
> **Optional**

Create two services: validate and persist todo items. Then the CreateTodo has only to call these services.

### Validate todo
It will be an [injectable]() service and expect the three todo values, then implement a validation logic in the service.
```js
import { injectable, param } from 'functionly'

@injectable()
export class ValidateTodo extends Service {
    static async handle( @param name, @param description, @param status) {
        const isValid = true
        return { isValid }
    }
}
```

### Persist todo
It will be an [injectable]() service and expect the three todo values and [inject]() a `TodoTable` then implement a persist logic in the service.
```js
import { injectable, param, inject } from 'functionly'

@injectable()
export class PersistTodo extends Service {
    static async handle( @param name, @param description, @param status, @inject(TodoTable) db) {
        let item = {
            id: generate(),
            name,
            description,
            status
        }
        await db.put({ Item: item })
        return item
    }
}
```

### Changed CreateTodo FunctionalService
[inject]() the two new services(`ValidateTodo`, `PersistTodo`) and change the business logic
```js
import { rest, description, param, inject } from 'functionly'

@rest({ path: '/createTodo', methods: ['post'] })
@description('create Todo service')
export class CreateTodo extends TodoService {
    static async handle(
        @param name,
        @param description,
        @param status,
        @inject(ValidateTodo) validateTodo,
        @inject(PersistTodo) persistTodo
    ) {
        let validateResult = await validateTodo({ name, description, status })
        if (!validateResult.isValid) {
            throw new Error('Todo validation error')
        }
        let persistTodoResult = await persistTodo({ name, description, status })
        return { ok: 1, persistTodoResult }
    }
}
```

### The source code of this example is available [here](https://github.com/jaystack/functionly-examples/tree/master/todoDB-es6)

# Install
```sh
npm install
```

# Run and Deploy with CLI
The CLI helps you to deploy and run the application.
1. CLI install
```sh
npm install functionly -g
```

## Local deployment
1. Create DynamoDB with Docker
```sh
docker run -d --name dynamodb -p 8000:8000 peopleperhour/dynamodb
```
2. Deploy will create the tables in DynamoDB
> Note: Create the [functionly.json](#functionly-configuration) in the project for short commands. Also, you don't have to pass all arguments.
```sh
functionly deploy local
```
## Run in local environment
During development, you can run the application on your local machine.
```sh
functionly start
```

## AWS deployment
> Disclaimer: As functionly provisions AWS services, charges may apply to your AWS account. We suggest you to visit https://aws.amazon.com/pricing/services/ to revise the possible AWS costs.

> [Set up](http://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/setup-credentials.html) AWS Credentials before deployment.

> Note: Create the [functionly.json](#functionly-configuration) in the project for short commands. Also, you don't have to pass all arguments. As the `deployTarget` is configured as `aws` (the default value configured) then the deploy command will use this as deployment target.

Functionly will create the package and deploy the application to AWS. The package is a [CloudFormation](https://aws.amazon.com/cloudformation/) template, it contains all the AWS resources so AWS can create or update the application's resources based on the template.
```sh
functionly deploy
```

> Congratulations! You have just created and deployed your first `functionly` application!

# Examples
- https://github.com/jaystack/functionly-examples

## Javascript
- [greeter](https://github.com/jaystack/functionly-examples/tree/master/greeter)
- [todoDB-es6](https://github.com/jaystack/functionly-examples/tree/master/todoDB-es6)

## Typescript
- [todoDB](https://github.com/jaystack/functionly-examples/tree/master/todoDB)
- [todoDB-mongo](https://github.com/jaystack/functionly-examples/tree/master/todoDB-mongo)
- [todoDBAdvanced](https://github.com/jaystack/functionly-examples/tree/master/todoDBAdvanced)
- [eventSource](https://github.com/jaystack/functionly-examples/tree/master/eventSource)
