import { up } from '../src/up'

// const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const isWebkit =
   /AppleWebKit/i.test(window.navigator.userAgent) &&
   !/Chrome/i.test(window.navigator.userAgent)

async function request() {
   return up(fetch)('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: { title: 'foo', body: 'bar', userId: 1 },
      onRequestStreaming() {},
   })
      .then(() => ({ success: true, error: undefined }))
      .catch((error) => ({ success: false, error: error.message }))
}

async function response() {
   return up(fetch)('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: { title: 'foo', body: 'bar', userId: 1 },
      onResponseStreaming() {},
   })
      .then(() => ({ success: true, error: undefined }))
      .catch((error) => ({ success: false, error: error.message }))
}

async function main() {
   const requestOutcome = await request()
   const responseOutcome = await response()

   document.getElementById('is-webkit')!.append(String(isWebkit))
   document
      .getElementById('request-streaming')!
      .append(JSON.stringify(requestOutcome, null, 3))
   document
      .getElementById('response-streaming')!
      .append(JSON.stringify(responseOutcome, null, 3))
}

main()
