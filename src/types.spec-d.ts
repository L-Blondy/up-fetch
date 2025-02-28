import { test } from 'vitest'
import type { JsonifiableArray, JsonifiableObject } from './types'

test('JsonifiableObject should support both types and interfaces', () => {
   interface Participant {
      id: string
      email: string
   }

   /**
    * 1 can pass while 2 fails
    */

   // 1
   const participant: Participant = {
      id: '1',
      email: 'whatever@gmail.com',
   } satisfies JsonifiableObject
   // 2
   participant satisfies JsonifiableObject
})

test('JsonifiableArray should support both types and interfaces', () => {
   interface Participant {
      id: string
      email: string
   }

   /**
    * 1 can pass while 2 fails
    */

   // 1
   const participants: Participant[] = [
      { id: '1', email: 'whatever@gmail.com' },
      { id: '2', email: 'whatever@gmail.com' },
   ] satisfies JsonifiableArray

   // 2
   participants satisfies JsonifiableArray
})
