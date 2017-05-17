
aws lambda invoke --function-name CreateTodo --payload file://./content/todoPayload.json --region eu-central-1 /tmp/corpjs
aws lambda invoke --function-name GetAllTodos --region eu-central-1 /tmp/corpjs

curl 'http://localhost:3000/createTodo?name=corpjs&description=corpjs-meetup&status=new'
curl 'http://localhost:3000/getAllTodos'