import { up } from '../src/up'

// const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const isWebkit =
   typeof window !== 'undefined' &&
   /AppleWebKit/i.test(window.navigator.userAgent) &&
   !/Chrome/i.test(window.navigator.userAgent)

function checkRequest() {
   let duplexUsed = false
   let contentType: string | null = null
   try {
      const req = new Request('https://a.b.c', {
         method: 'POST',
         body: new ReadableStream(),
         // @ts-expect-error outdated types
         get duplex() {
            duplexUsed = true
            return 'half'
         },
      })
      contentType = req.headers.get('Content-Type')
   } catch (_) {
      return { duplexUsed, duplexThrows: true, contentType }
   }
   return { duplexUsed, duplexThrows: false, contentType }
}

async function request() {
   return up(fetch)('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: { title: 'foo', body: 'bar', userId: 1 },
      onRequestStreaming() {},
   })
      .then((data) => ({ success: true, error: undefined, data }))
      .catch((error) => ({ success: false, error: error.message }))
}

async function response() {
   return up(fetch)('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: { title: 'foo', body: 'bar', userId: 1 },
      onResponseStreaming() {},
   })
      .then((data) => ({ success: true, error: undefined, data }))
      .catch((error) => ({ success: false, error: error.message }))
}

async function main() {
   const { contentType, duplexThrows, duplexUsed } = checkRequest()
   const requestStreaming = await request()
   const responseStreaming = await response()

   document.getElementById('result')!.append(
      JSON.stringify(
         {
            isWebkit,
            duplexUsed,
            duplexThrows,
            contentType,
            requestStreaming,
            responseStreaming,
         },
         null,
         3,
      ),
   )
}

main()
