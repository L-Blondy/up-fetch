import { number, object } from 'valibot'
import { up } from './up'

// TODO: remove
const upfetch = up(fetch, () => ({
   //  parseResponse: (res) => ({
   //     a: 1,
   //  }),
}))

async function doit() {
   const data = await upfetch('', {
      parseResponse: (res) => Number(res),
      // schema: object({
      //    a: number(),
      // }),
   })
}
