/// <reference types="cypress" />
import N3 = require('n3');

export class LdesServer {
    private parser = new N3.Parser({ format: 'text/turtle' });
    private rdfType = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

    public treePrefix = 'https://w3id.org/tree#';
    private treeView = this.treePrefix + 'view';
    private treeNode = this.treePrefix + 'node';

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

    expectMutableFragment(response: Cypress.Response<any>, isImmutable: boolean) {
        if (isImmutable) {
            expect(response.headers['cache-control']).to.contain('immutable');
        } else {
            expect(response.headers['cache-control']).not.to.contain('immutable');
        }
    }

    parseQuads(response: Cypress.Response<any>) {
        return new N3.Store(this.parser.parse(response.body));
    }

    expectNoRelation(store: any, relationType: string): void {
        this.expectRelationCount(store, relationType, 0);
    }

    expectOneRelation(store: any, relationType: string): string {
        return this.expectRelationCount(store, relationType, 1)[0];
    }

    expectRelationCount(store: any, relationType: string, count: number): string[] {
        const ids = store.getSubjects(this.rdfType, relationType, null);
        if (!count) {
            expect(ids).to.be.empty;
            return;
        }

        expect(ids).to.have.length(count);
        return ids.map((id: any) => store.getObjects(id, 'https://w3id.org/tree#node', null)[0].value);
    }

}
