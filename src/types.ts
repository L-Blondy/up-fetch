export type ParseResponse<TData> = (response: Response, options: BuiltOptions) => Promise<TData>

export type ParseResponseError<TError = any> = (
   res: Response,
   options: BuiltOptions,
) => Promise<TError>

export type BuiltOptions<TData = any, TError = any> = {
   parseResponse: ParseResponse<TData>
   parseResponseError: ParseResponseError<TError>
}

export type UpOptions<TUpData, TUpError> = {
   parseResponse?: ParseResponse<TUpData>
   parseResponseError?: ParseResponseError<TUpError>
}

export type FetcherOptions<TFetcherData, TFetcherError> = {
   parseResponse?: ParseResponse<TFetcherData>
   parseResponseError?: ParseResponseError<TFetcherError>
}
