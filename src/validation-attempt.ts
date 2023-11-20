import { ZodSchema, z } from 'zod'

type UpOpts = {
   validationStrategy: <TVal, TFetchData, TData>(
      validate: TVal,
      data: TFetchData,
   ) => TData
}

type FetchOpts<TVal> = {
   validate: TVal
}

function up({ validationStrategy }: UpOpts) {
   return <TVal, TFetchData, TData>({ validate }: FetchOpts<TVal>):TData => {
      const data: TFetchData = { a: 1, b: 2 } as any
      const res = validationStrategy<TVal, TFetchData, TData>(validate, data) 
      return res
   }
}

const zodStrategy = < TFetchData, TData>(
   validate: ZodSchema<TData, any, TFetchData>,
   data: TFetchData,
): TData => {
   return validate.parse(data) 
}

const upfetch = up({ validationStrategy: zodStrategy })

const res = upfetch({ validate :  })
