import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fallbackOptions } from 'src/fallback-options'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { up } from '..'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const baseUrl = 'https://example.com'

describe('params', () => {
   describe('should merge up.params and upfetch.params with input URL params. Priority: up.params < input.search < upfetch.params', () => {
      test.each`
         input                                           | upParams              | upfetchParams          | finalUrl
         ${'https://example.com/?input=param'}           | ${{ come: 'on' }}     | ${{ hello: 'people' }} | ${'https://example.com/?input=param&come=on&hello=people'}
         ${new URL('https://example.com/?input=param')}  | ${{ come: 'on' }}     | ${{ hello: 'people' }} | ${'https://example.com/?input=param&come=on&hello=people'}
         ${'https://example.com/?hello=people'}          | ${{ hello: 'world' }} | ${{}}                  | ${'https://example.com/?hello=people'}
         ${new URL('https://example.com/?hello=people')} | ${{ hello: 'world' }} | ${{}}                  | ${'https://example.com/?hello=people'}
         ${'https://example.com/?hello=people'}          | ${{ hello: 'world' }} | ${{ hello: 'test' }}   | ${'https://example.com/?hello=people&hello=test'}
         ${new URL('https://example.com/?hello=people')} | ${{ hello: 'world' }} | ${{ hello: 'test' }}   | ${'https://example.com/?hello=people&hello=test'}
      `('%#', async ({ input, upParams, upfetchParams, finalUrl }) => {
         server.use(
            http.get(baseUrl, ({ request }) => {
               expect(request.url).toEqual(finalUrl)
               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            params: upParams,
         }))

         await upfetch(input, {
            params: upfetchParams,
         })
      })
   })

   test('should support removing an up.params[key] by setting upfetch.params[key] to undefined', async () => {
      server.use(
         http.get(baseUrl, ({ request }) => {
            expect(new URL(request.url).search).toEqual('?hello=world')
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         params: { hello: 'world', input: 'test' },
      }))

      await upfetch('/', {
         params: { input: undefined },
      })
   })

   test('should strip top level undefined values from the queryString', async () => {
      server.use(
         http.get(baseUrl, ({ request }) => {
            expect(request.url).toEqual('https://example.com/')
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         params: { key: 'value' },
      }))

      await upfetch(baseUrl, {
         params: { key: undefined },
      })
   })
})

describe('serializeParams', () => {
   test('should receive the params object for serialization', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         serializeParams(params) {
            expect(params).toEqual({ a: 1 })
            return ''
         },
      }))
      await upfetch('', { params: { a: 1 } })
   })

   test('URL-defined params should not be passed to the serialization process', async () => {
      server.use(
         http.get('https://example.com/path', ({ request }) => {
            expect(new URL(request.url).search).toEqual('?b=2&a=1')

            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         serializeParams(params) {
            expect(params).toEqual({ a: 1 })
            return fallbackOptions.serializeParams(params)
         },
      }))
      await upfetch('path?b=2', { params: { a: 1 } })
   })

   describe('should allow returning a string with and without question mark', () => {
      test.each`
         serializeParams
         ${() => 'should=work'}
         ${() => '?should=work'}
      `('%#', async ({ serializeParams }) => {
         server.use(
            http.get(baseUrl, ({ request }) => {
               expect(new URL(request.url).search).toEqual('?should=work')

               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            serializeParams,
         }))
         await upfetch('/')
      })
   })

   test('should be called even if no params are defined', async () => {
      server.use(
         http.get(baseUrl, () => {
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         serializeParams() {
            count++
            return ''
         },
      }))
      await upfetch('')
      expect(count).toEqual(2)
   })

   test('should allow upfetch.serializeParams to override up.serializeParams', async () => {
      server.use(
         http.get(baseUrl, ({ request }) => {
            expect(new URL(request.url).search).toEqual('?from=upfetch')

            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         serializeParams: () => 'from=up',
      }))
      await upfetch('', { serializeParams: () => 'from=upfetch' })
   })
})
