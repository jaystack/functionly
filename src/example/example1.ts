import { FunctionalService, FunctionalApi, annotations, DynamoDB } from '../index' // 'corpjs-serverless'
const { role, apiGateway, environment, description, tag, runtime, param, inject, injectable, log } = annotations

@role("arn:aws:iam::856324650258:role/service-role/Vektor-HW-Role")
@runtime({ type: 'nodejs6.10', memorySize: 512, timeout: 3 })
export class BaseService extends FunctionalService { }


@injectable
@environment('%ClassName%_TABLE_NAME', 'TestTable_corpjs_serverless')
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
                "Id": Math.random().toString(),
                name,
                email: emailAddress,
                age
            }
        })

        return { ok: 1, name, email: emailAddress, age }
    }

    public async invoke(name: string, email: string, age: number) {
        return await super.invoke(name, email, age)
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

        let puttoCartResult = await cart.invoke(name, email, age)

        return { ok1: 1, puttoCartResult }
    }

}

export const cartPut = PutToCart.createInvoker()
export const cartRead = ReadCart.createInvoker()
export const hello = Hello.createInvoker()
