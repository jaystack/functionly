import { FunctionalService, FunctionalApi, annotations } from '../index' // 'corpjs-serverless'
const { role, http, environment, handler, description, tag, runtime, param, service } = annotations


const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout))




@role("arn:aws:iam::856324650258:role/service-role/Vektor-HW-Role")
@runtime('nodejs6.10')
export class BaseService extends FunctionalService {
}


@handler(512, 3)
@http('/get', 'get')
@description('PuttoCart desc...')
@environment('TABLE_NAME', 'cart')
@environment('myenv', 'PuttoCart env')
@tag('foo', 'bar')
// @api(xxxx)
export class PuttoCart extends BaseService {

    public async handle( @param key1: string, @param('key2') key2, @param('key3') p3) {
        console.log('start', key1, key2)
        console.log('stop', process.env.myenv)



        return { ok: 1, key1, key2, p3, constValue: 5 }
    }

    public async invoke(key1: string, key2: string, p3: number) {
        return await super.invoke(key1, key2, p3)
    }
}

@handler(512, 3)
@http('/hello', 'get')
@description('hello desc...')
@environment('myenv', 'Hello env')
@environment('DYNAMODB_TABLE_NAME', 'TestTable_corpjs_serverless')
export class Hello extends BaseService {

    // @service('DynamoDB', 'TestTable_corpjs_serverless')
    // @service('DynamoDB', () => 'TestTable_corpjs_serverless')
    // @service('DynamoDB', () => process.env.TABLE_NAME)
    // @service('DynamoDB') >>> lookup from process.env.DYNAMODB_TABLE_NAME

    public async handle( @service('PuttoCart') cart: PuttoCart, @service('DynamoDB') db) {
        console.log('before invoke', process.env.myenv)
        let puttoCartResult = await cart.invoke("p1", "p2", 3)
        console.log('after invoke', process.env.myenv)

        await db.put({
            Item: {
                "Id": Math.random().toString(),
                "username": "hello world"
            }
        })

        return { ok1: 1, puttoCartResult }
    }

    public async invoke() {
        return await super.invoke()
    }
}

const saveData = (db, params) => {
    return new Promise((resolve, reject) => {
        db.put(params, function (err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    })
}

export const cart = PuttoCart.createInvoker()
export const hello = Hello.createInvoker()
