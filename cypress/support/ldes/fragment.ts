/// <reference types="cypress" />

import { rdf, terms, tree } from './rdf-common';
import { UrlResponse } from "./url-response";
import { Relation } from "./relation";

export class Fragment extends UrlResponse {

    get relations(): Relation[] {
        return this.store.getObjects(null, tree.relation, null)
            .map(relation => new Relation(this.store.getQuads(relation, null, null, null)));
    }

    get relation(): Relation {
        const relations = this.relations;
        expect(relations.length).to.equal(1);
        return relations[0];
    }

    get isNode(): boolean {
        return this.store.getQuads(this.url, rdf.type, tree.Node, null).length === 1;
    }

    isPartOf(collectionUrl: string): boolean {
        return this.store.getQuads(null, terms.isPartOf, collectionUrl, null).length === 1;
    }

    getLatestFragment(nextType: string): Cypress.Chainable<Fragment> {
        const relations = this.relations.filter(x => x.type === tree.prefix(nextType));
        return relations.length === 1
            ? new Fragment(relations[0].link).visit().then(fragment => fragment.getLatestFragment(nextType))
            : cy.wrap(this);
    }

    isViewOf(ldesUrl: string): boolean {
        return this.store.getQuads(ldesUrl, tree.view, this.url, null).length === 1;
    }

    expectNoOtherRelationThan(type: string): void {
        expect(this.relations.every(x => x.type === tree.prefix(type))).to.be.true;
    }

    expectSingleRelationOf(type: string): Relation {
        const relations = this.relations.filter(x => x.type === tree.prefix(type));
        expect(relations.length).to.equal(1);
        return relations[0];
    }

    expectMultipleRelationOf(type: string, count: number): Relation[] {
        const relations = this.relations.filter(x => x.type === tree.prefix(type));
        expect(relations.length).to.equal(count);
        return relations;
    }

    expectMultipleRelationsOfType(type: string): Relation[] {
        const relations = this.relations;
        relations.forEach(relation => {
            expect(relation.type === tree.prefix(type));
        });
        return relations;
    }
}
