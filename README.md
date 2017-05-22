# functionly
## install:
- npm install
- npm run build
- npm install -g
- functionly -h

## examples
### config check
- functionly metadata aws ./lib/src/example/example1.js
### run in local
- functionly local 3000 ./lib/src/example/example1.js
    - http://localhost:3000/hello
### deploy to aws
- functionly deploy aws ./lib/src/example/example1.js --aws-region eu-central-1 --aws-bucket &lt;bucketname&gt;


## local DynamoDB
### create a docker image
- docker run -d --name dynamodb -p 8000:8000 peopleperhour/dynamodb
