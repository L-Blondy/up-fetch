const jsonRegexp = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i
const textRegexp = /^(?:image\/svg|application\/(?:xml|xhtml|html))$/i

const getParsingMethod = (
   response: Response,
): 'json' | 'text' | 'blob' | 'formData' => {
   const contentType = response.headers.get('content-type')?.split(';')[0]
   return !contentType || jsonRegexp.test(contentType)
      ? 'json'
      : contentType.startsWith('text/') || textRegexp.test(contentType)
        ? 'text'
        : contentType === 'multipart/form-data'
          ? 'formData'
          : 'blob'
}

export const parseResponse = (res: Response) =>
   // https://github.com/unjs/ofetch/issues/324
   res.body || (res as any)._bodyInit ? res[getParsingMethod(res)]() : null
