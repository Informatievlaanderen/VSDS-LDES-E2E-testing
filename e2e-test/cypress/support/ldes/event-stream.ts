import { tree } from './rdf-common';
import { UrlResponse } from "./url-response";


export class EventStream extends UrlResponse {
    get viewUrl(): string {
        return this.store.getObjects(null, tree.view, null)[0].value;
    }
}
