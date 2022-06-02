export interface IResponse<TBody> {
    body: TBody;
    status: number;
}

export interface IGetRequest<TQuery> {
    query: TQuery;
}

export interface IPostRequest<TBody, TQuery = void> {
    body: TBody;
    query?: TQuery;
}
