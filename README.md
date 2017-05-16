# corpjs-serverless
## install:
- npm install
- npm run build
- npm install -g
- corpjs-serverless -h

## examples
### config check
- corpjs-serverless metadata aws ./lib/src/example/example1.js
### run in local
- corpjs-serverless local 3000 ./lib/src/example/example1.js
    - http://localhost:3000/hello
### deploy to aws
- corpjs-serverless deploy aws ./lib/src/example/example1.js --aws-region eu-central-1 --aws-bucket corpjs-serverless


## local DynamoDB
### create a docker image
- docker run -d --name dynamodb -p 8000:8000 peopleperhour/dynamodb
### create table in DynamoDB
- aws dynamodb create-table --table-name TestTable_corpjs_serverless --attribute-definitions AttributeName=Id,AttributeType=S --key-schema AttributeName=Id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=2 --endpoint-url http://localhost:8000 --region eu-central-1