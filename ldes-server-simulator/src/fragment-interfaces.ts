import { IHeaders } from "http-interfaces";

export interface IAlias {
    original: string;
    alias: string;
}

export interface IRedirection {
    from: string;
    to: string;
}

export interface IStatisticsResponses {
    count: number, 
    at: Date[]
}

export interface IStatistics {
    aliases: string[];
    fragments: string[];
    responses: {[key: string]: IStatisticsResponses};
}

export interface IFragmentId { 
    id: string;
}

export interface IFragmentInfo extends IFragmentId, IHeaders {}
