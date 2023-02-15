import { EventStream } from './ldes';

export class LdesServer {

    constructor(private baseUrl: string) { }

    getLdes(collection: string) {
        return new EventStream(`${this.baseUrl}/${collection}`).visit();
    }
    
}
