const controller = new AbortController()
const signal = controller.signal

await fetch('https://dummyjson.com/products/1', { signal })
   .then((res) => console.log(res))
   .catch((e) => console.log(e))
