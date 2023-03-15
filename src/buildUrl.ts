import { withQuestionMark } from './withQuestionMark'
import { Config } from './buildConfig'

export const buildUrl = ({ baseUrl, url, params, serializeParams }: Config) => {
   const base = typeof baseUrl === 'string' ? baseUrl : baseUrl.origin + baseUrl.pathname
   // params of type string are already considered serialized
   const serializedParams = withQuestionMark(
      typeof params === 'string'
         ? params
         : typeof params === 'object' && params
         ? serializeParams(params)
         : '',
   )
   if (base && url && !isFullUrl(url)) {
      return `${addTrailingSlash(base)}${stripLeadingSlash(url)}${serializedParams}`
   }
   if (base && !url) {
      return `${base}${serializedParams}`
   }

   return `${url}${serializedParams}`
}

function addTrailingSlash(str: string) {
   if (!str) return ''
   return str.endsWith('/') ? str : `${str}/`
}

function stripLeadingSlash(str: string) {
   if (!str) return ''
   return str.startsWith('/') ? str.slice(1) : str
}

function isFullUrl(url: string): boolean {
   return url.startsWith('http://') || url.startsWith('https://')
}
