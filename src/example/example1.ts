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
        console.log('stop',  process.env.myenv)

       

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
export class Hello extends BaseService {

    public async handle( @service('PuttoCart') cart: PuttoCart) {
        console.log('before invoke', process.env.myenv)
        let puttoCartResult = await cart.invoke("p1", "p2", 3)
        console.log('after invoke', process.env.myenv)
        return { ok1: 1, puttoCartResult }
    }

    public async invoke() {
        return await super.invoke()
    }
}

export const cart = PuttoCart.createInvoker()
export const hello = Hello.createInvoker()
