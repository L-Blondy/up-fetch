import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { up } from 'src/up'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { bodyMock } from './_mocks'

const baseUrl = 'https://example.com'
const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('body', () => {
   test('should ignore up.body', async () => {
      server.use(
         http.post(baseUrl, async ({ request }) => {
            const body = await request.text()
            if (count === 1) {
               expect(body).toBe('')
            }
            if (count === 2) {
               expect(body).toBe('my body')
            }
            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      let count = 1

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         method: 'POST',
         body: 'my body',
      }))
      await upfetch('')
      count++
      await upfetch('', { body: 'my body' })
   })
})

describe('serializeBody', () => {
   test.each`
      body                            | shouldCallSerializeBody
      ${{}}                           | ${true}
      ${{ a: 1 }}                     | ${true}
      ${[1, 2]}                       | ${true}
      ${bodyMock.classJsonifiable}    | ${true}
      ${bodyMock.classNonJsonifiable} | ${true}
      ${bodyMock.buffer}              | ${true}
      ${bodyMock.dataview}            | ${true}
      ${bodyMock.blob}                | ${true}
      ${bodyMock.typedArray}          | ${true}
      ${bodyMock.formData}            | ${true}
      ${bodyMock.urlSearchParams}     | ${true}
      ${bodyMock.stream}              | ${true}
      ${''}                           | ${true}
      ${0}                            | ${true}
      ${undefined}                    | ${false}
      ${null}                         | ${false}
   `(
      'Should be called on any non-nullish an non-string body',
      async ({ body, shouldCallSerializeBody }) => {
         server.use(
            http.post(baseUrl, async ({ request }) => {
               const actualBody = await request.text()
               expect(actualBody === 'serialized').toBe(shouldCallSerializeBody)

               return HttpResponse.json({ hello: 'world' }, { status: 200 })
            }),
         )

         const upfetch = up(fetch, () => ({
            baseUrl: baseUrl,
            method: 'POST',
         }))
         await upfetch('', {
            body,
            serializeBody: () => 'serialized',
            // @ts-ignore the global fetch type does not include "duplex"
            duplex: body === bodyMock.stream ? 'half' : undefined,
         })
      },
   )

   test('serializeBody in upfetch should override serializeBody in up', async () => {
      server.use(
         http.post(baseUrl, async ({ request }) => {
            expect(await request.text()).toEqual('from=upfetch')

            return HttpResponse.json({ hello: 'world' }, { status: 200 })
         }),
      )

      const upfetch = up(fetch, () => ({
         baseUrl: baseUrl,
         serializeBody: () => 'from=up',
      }))
      await upfetch('', {
         body: { a: 1 },
         method: 'POST',
         serializeBody: () => 'from=upfetch',
      })
   })
})
