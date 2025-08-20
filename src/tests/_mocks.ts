class NonJsonifiable {
   a: number
   constructor() {
      this.a = 1
   }
}

class Jsonifiable {
   toJSON() {
      return { z: 26 }
   }
}

const buffer = new ArrayBuffer(8)
const typedArray = new Int32Array(buffer)
const formData = new FormData()
const dataview = new DataView(buffer)
dataview.setInt16(0, 256, true /* littleEndian */)
formData.append('username', 'me')
const getStream = () =>
   new ReadableStream({
      // biome-ignore lint/suspicious/useAwait: false
      async start(controller) {
         controller.enqueue('This ')
         controller.enqueue('is ')
         controller.enqueue('a ')
         controller.enqueue('slow ')
         controller.enqueue('request.')
         controller.close()
      },
   }).pipeThrough(new TextEncoderStream())
const blob = new Blob([JSON.stringify({ hello: 'world' }, null, 2)], {
   type: 'application/json',
})
const classJsonifiable = new Jsonifiable()
const classNonJsonifiable = new NonJsonifiable()
const urlSearchParams = new URLSearchParams('a=1&b=2')

export const bodyMock = {
   classJsonifiable,
   classNonJsonifiable,
   blob,
   buffer,
   formData,
   typedArray,
   dataview,
   stream: getStream(),
   getStream,
   urlSearchParams,
}
