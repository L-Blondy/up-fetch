export const withQuestionMark = (str: string) => {
   if (!str) return ''
   return str.startsWith('?') ? str : `?${str}`
}
