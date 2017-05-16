import { FunctionalService, FunctionalApi, annotations, DynamoDB } from '../index' // 'corpjs-serverless'
const { role, http, environment, handler, description, tag, runtime, param, inject, injectable, resource } = annotations

const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout))




@role("arn:aws:iam::856324650258:role/service-role/Vektor-HW-Role")
@runtime('nodejs6.10')
export class BaseService extends FunctionalService { }


@injectable
@environment('%ClassName%_TABLE_NAME', 'TestTable_corpjs_serverless')
export class UsersTable extends DynamoDB { }


@handler(512, 3)
@injectable
@http('/cart', 'post')
@description('PutToCart desc...')
@resource(UsersTable)
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


@handler(512, 3)
@http('/cart', 'get')
@description('ReadCart desc...')
@resource(UsersTable)
export class ReadCart extends BaseService {

    public async handle(
        @inject(UsersTable) db
    ) {

        let items = await db.scan()

        return { ok: 1, items }
    }

}



@handler(512, 3)
@http('/hello', 'get')
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
