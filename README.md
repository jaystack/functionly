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
- corpjs-serverless deploy aws ./lib/src/example/example1.js
