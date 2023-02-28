/// <reference types="cypress" />
import N3 = require('n3');
import { prov, rdf, terms } from './rdf-common';


export class Member {

    private store: N3.Store;

    constructor(private _id: string, quads: N3.Quad[]) {
        this.store = new N3.Store(quads);
    }
    
    get id(): string {
        return this._id;
    }
    
    get type(): string {
        return this.store.getObjects(null, rdf.type, null)[0].value;
    }

    get isVersionOf(): string {
        return this.store.getObjects(null, terms.isVersionOf, null)[0]?.value;
    }
    
    get generatedAtTime(): string {
        return this.store.getObjects(null, prov.generatedAtTime, null)[0]?.value;
    }
    
    property(predicate: string): string {
        return this.store.getObjects(null, predicate, null)[0]?.value;
    }
}
