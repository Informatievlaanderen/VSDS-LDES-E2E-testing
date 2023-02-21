/// <reference types="cypress" />
import N3 = require('n3');
import { rdf, tree } from './rdf-common';


export class Relation {
    private store: N3.Store;

    constructor(quads: N3.Quad[]) {
        this.store = new N3.Store(quads);
    }

    get type(): string {
        return this.store.getObjects(null, rdf.type, null)[0].value;
    }
    
    get link(): string {
        return this.store.getObjects(null, tree.node, null)[0].value;
    }

    get path(): string {
        return this.store.getObjects(null, tree.path, null)[0].value;
    }

    get value(): string {
        return this.store.getObjects(null, tree.value, null)[0].value;
    }
}
