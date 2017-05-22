import { FunctionalService, FunctionalApi, annotations, DynamoDB } from '../index' // 'functionly'
const { role, apiGateway, environment, description, tag, runtime, param, inject, injectable, log, functionName, dynamoTable } = annotations

@role("arn:aws:iam::856324650258:role/corpjs-functionly")
@runtime({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
export class BaseService extends FunctionalService { }


@injectable
// @environment('%ClassName%_TABLE_NAME', '%ClassName%_corpjs_functionly')
// OR
@dynamoTable({
    tableName: '%ClassName%_corpjs_functionly',
    // environmentKey: '%ClassName%_TABLE_NAME',
    // nativeConfig: {
    //     AttributeDefinitions: [
    //         { AttributeName: "id", AttributeType: "S" }
    //     ],
    //     KeySchema: [
    //         { AttributeName: "id", KeyType: "HASH" }
    //     ],
    //     ProvisionedThroughput: {
    //         ReadCapacityUnits: 2,
    //         WriteCapacityUnits: 2
    //     }
    // }
})
export class UsersTable extends DynamoDB { }


@injectable
@apiGateway({ path: '/cart', method: 'post' })
@description('PutToCart desc...')
export class PutToCart extends BaseService {

    public async handle(
        @param name,
        @param('email') emailAddress,
        @param('age') age,
        @inject(UsersTable) db
    ) {

        await db.put({
            Item: {
                "id": Math.random().toString(),
                name,
                email: emailAddress,
                age
            }
        })

        return { ok: 1, name, email: emailAddress, age }
    }

    public async invoke(params: { name: string, email: string, age: number }) {
        return await super.invoke(params)
    }
}


@apiGateway({ path: '/cart', method: 'get' })
@description('ReadCart desc...')
export class ReadCart extends BaseService {

    public async handle(
        @inject(UsersTable) db
    ) {

        let items = await db.scan()

        return { ok: 1, items }
    }

}



@functionName('Hello')
@apiGateway({ path: '/hello', method: 'get' })
@description('hello desc...')
@tag('foo', 'bar')
export class Hello extends BaseService {

    public async handle(
        @param name,
        @param email,
        @param age,
        @inject(PutToCart) cart: PutToCart
    ) {

        let puttoCartResult = await cart.invoke({ name, email, age })

        return { ok1: 1, puttoCartResult }
    }

}

export const cartPut = PutToCart.createInvoker()
export const cartRead = ReadCart.createInvoker()
export const hello = Hello.createInvoker()
