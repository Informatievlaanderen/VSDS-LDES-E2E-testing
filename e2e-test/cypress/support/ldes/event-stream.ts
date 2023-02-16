import { ldes, rdf, tree } from './rdf-common';
import { UrlResponse } from "./url-response";

export class EventStream extends UrlResponse {

    get viewUrl(): string {
        return this.store.getObjects(null, tree.view, null)[0].value;
    }

    get isEventStream(): boolean {
        return this.store.getQuads(this.url, rdf.type, ldes.EventStream, null).length === 1;
    }
        
}
