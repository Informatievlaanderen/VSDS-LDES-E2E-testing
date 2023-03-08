import { ldes, rdf, tree } from './rdf-common';
import { UrlResponse } from "./url-response";

export class EventStream extends UrlResponse {

    viewUrl(name?: string): string {
        const views = this.store.getObjects(null, tree.view, null);
        if (name) {
            return views.filter(x => x.value.endsWith(name)).shift()?.value;
        }
        switch (views.length) {
            case 0: return undefined;
            case 1: return views[0].value;
            default: throw new Error(`found multiple views: ${views.map(x => x.value).join(',')}`);
        }
    }

    getViews(viewName: string) {
        const views = this.store.getObjects(null, tree.view, null);
        return views.find(x => x.id.endsWith(viewName)).value;
    }

    get isEventStream(): boolean {
        return this.store.getQuads(this.url, rdf.type, ldes.EventStream, null).length === 1;
    }

}
