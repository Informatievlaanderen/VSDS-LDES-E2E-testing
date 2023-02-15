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
}
