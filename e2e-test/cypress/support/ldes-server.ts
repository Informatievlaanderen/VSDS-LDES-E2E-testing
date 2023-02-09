/// <reference types="cypress" />
import N3 = require('n3');

export class LdesServer {
    private parser = new N3.Parser({ format: 'text/turtle' });
    private rdfType = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    private treeView = 'https://w3id.org/tree#view';
    private treeNode = 'https://w3id.org/tree#node';
    private treeGtOrEq = 'https://w3id.org/tree#GreaterThanOrEqualToRelation';
    private treeLtOrEq = 'https://w3id.org/tree#LessThanOrEqualToRelation';

    constructor(private baseUrl: string) { }

    private searchByPredicate(responseBody: string, predicate: string) {
        const quads = this.parser.parse(responseBody);
        const store = new N3.Store(quads);
        const results = store.getObjects(null, predicate, null);
        return results[0].value;
    }

    getFirstFragmentUrl() {
        return cy.request(`${this.baseUrl}/mobility-hindrances`)
            .then(response => this.searchByPredicate(response.body, this.treeView))
            .then(view => cy.request(view)
                .then(response => this.searchByPredicate(response.body, this.treeNode))
            );
    }

    private expectMutableFragment(response: Cypress.Response<any>, isImmutable: boolean) {
        if (isImmutable) {
            expect(response.headers['cache-control']).to.contain('immutable');
        } else {
            expect(response.headers['cache-control']).not.to.contain('immutable');
        }
    }

    private expectRelation(store: any, relationType: string, exists: boolean) {
        const ids = store.getSubjects(this.rdfType, relationType, null);
        if (!exists) {
            expect(ids).to.be.empty;
            return undefined;
        }

        expect(ids).to.have.length(1);
        return store.getObjects(ids[0], 'https://w3id.org/tree#node', null)[0].value;
    }

    checkFirstFragmentAndGetMiddleFragmentUrl(firstFragmentUrl: string) {
        return cy.request(firstFragmentUrl).then(response => {
            this.expectMutableFragment(response, true);

            const store = new N3.Store(this.parser.parse(response.body));
            this.expectRelation(store, this.treeLtOrEq, false);
            return this.expectRelation(store, this.treeGtOrEq, true);
        });
    }

    checkMiddleFragmentAndGetLastFragmentUrl(middleFragmentUrl: string) {
        return cy.request(middleFragmentUrl).then(response => {
            this.expectMutableFragment(response, true);

            const store = new N3.Store(this.parser.parse(response.body));
            this.expectRelation(store, this.treeLtOrEq, true);
            return this.expectRelation(store, this.treeGtOrEq, true);
        });
    }

    checkLastFragment(lastFragmentUrl: string) {
        return cy.request(lastFragmentUrl).then(response => {
            this.expectMutableFragment(response, false);

            const store = new N3.Store(this.parser.parse(response.body));
            this.expectRelation(store, this.treeGtOrEq, false);
            return this.expectRelation(store, this.treeLtOrEq, true);
        });
    }

}
