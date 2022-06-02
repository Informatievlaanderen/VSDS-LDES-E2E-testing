export interface IHeaders { 
    [keyof: string]: any
};

export interface IResponse<TBody> {
    body: TBody;
    status: number;
    headers?: IHeaders;
}

export interface IGetRequest<TQuery> {
    query: TQuery;
}

export interface IPostRequest<TBody, TQuery = void> {
    body: TBody;
    query?: TQuery;
}
