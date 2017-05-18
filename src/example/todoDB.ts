import { generate } from 'shortid'

import { FunctionalService, FunctionalApi, annotations, DynamoDB } from '../index'
const { role, apiGateway, environment, description, tag, runtime, param, inject, injectable, log } = annotations

@role("arn:aws:iam::856324650258:role/corpjs-serverless")
@runtime({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
export class TodoService extends FunctionalService { }


@injectable
@environment('%ClassName%_TABLE_NAME', '%ClassName%_corpjs_serverless')
export class TodoTable extends DynamoDB { }


@injectable
@apiGateway({ path: '/validateTodo', method: 'post' })
@description('validate Todo service')
export class ValidateTodo extends TodoService {

    public async handle( @param name, @param description, @param status) {
        const isValid = Math.random() > 0.3

        return { isValid }
    }

    public async invoke(params: { name: string, description: string, status: string }) {
        return await super.invoke(params)
    }
}


@injectable
@apiGateway({ path: '/persistTodo', method: 'post' })
@description('persist Todo service')
export class PersistTodo extends TodoService {

    public async handle( @param name, @param description, @param status, @inject(TodoTable) db: DynamoDB) {

        let item = {
            Id: generate(),
            name,
            description,
            status
        }

        await db.put({ Item: item })

        return item
    }
}


@apiGateway({ path: '/createTodo' })
@description('create Todo service')
export class CreateTodo extends TodoService {

    public async handle( @param name, @param description, @param status, @inject(ValidateTodo) validateTodo: ValidateTodo,
        @inject(PersistTodo) persistTodo: PersistTodo
    ) {

        let validateResult = await validateTodo.invoke({ name, description, status })
        if (!validateResult.isValid) {
            throw new Error('Todo validation error')
        }

        let persistTodoResult = await persistTodo.invoke({ name, description, status })

        return { ok: 1, persistTodoResult }
    }

}



@apiGateway({ path: '/getAllTodos', cors: true })
@description('get all Todo service')
export class GetAllTodos extends TodoService {

    public async handle(
        @inject(TodoTable) db: DynamoDB
    ) {

        let items = await db.scan()

        return { ok1: 1, items }
    }

}

export const validateTodo = ValidateTodo.createInvoker()
export const persistTodo = PersistTodo.createInvoker()
export const createTodo = CreateTodo.createInvoker()
export const getAllTodos = GetAllTodos.createInvoker()
