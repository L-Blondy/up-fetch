import { up } from '../src/up'

const isWebkit =
   /AppleWebKit/i.test(window.navigator.userAgent) &&
   !/Chrome/i.test(window.navigator.userAgent)

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

async function test() {
   let outcome: any
   try {
      const data = await up(fetch)(
         'https://jsonplaceholder.typicode.com/posts',
         {
            method: 'POST',
            body: {
               title: 'foo',
               body: 'bar',
               userId: 1,
            },
            onRequestStreaming() {},
            onResponseStreaming() {},
         },
      )
      outcome = { data }
   } catch (error) {
      outcome = { error }
   }
   return outcome
}

test().then((outcome) => {
   document
      .getElementById('window-safari')!
      .append(String(!!(window as any).safari))
   document.getElementById('is-safari')!.append(String(isSafari))
   document.getElementById('is-webkit')!.append(String(isWebkit))
   document.getElementById('outcome')!.append(
      JSON.stringify(
         {
            success: !!outcome.data,
            error: outcome.error
               ? {
                    name: outcome.error.name,
                    message: outcome.error.message,
                    stack: outcome.error.stack,
                 }
               : undefined,
         },
         null,
         3,
      ),
   )
})
