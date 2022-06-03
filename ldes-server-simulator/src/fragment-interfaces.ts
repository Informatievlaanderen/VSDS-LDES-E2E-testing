import { IHeaders } from "http-interfaces";

export interface IAlias {
    original: string;
    alias: string;
}

export interface IRedirection {
    from: string;
    to: string;
}

export interface IStatistics {
    aliases: string[];
    fragments: string[];
}

export interface IFragmentId { 
    id: string;
}

export interface IFragmentInfo extends IFragmentId, IHeaders {}
