/// <reference types="cypress" />

type CountResult = { count: number, ids: string[] };

export class MongoRestApi {
    
    constructor(public baseUrl: string) { }

    checkCount(database: string, collection: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(database, collection, count, checkFn), { timeout: 120000, interval: 5000 });
    }

    private hasCount(database: string, collection: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/${database}/${collection}`)
            .then(response => response.body)
            .then((result: CountResult) => cy.log('Actual count: ' + result.count).then(() => checkFn(result.count , count)));
    }

    count(database: string, collection: string) {
        return cy.request(`${this.baseUrl}/${database}/${collection}`)
            .then(response => response.body)
            .then((result: CountResult) => result.count);
    }

    private documentIds(database: string, document: string) {
        return cy.request(`${this.baseUrl}/${database}/${document}?includeIds=true`)
                 .then(response => response.body && (response.body.ids as string[]));
    }

    fragmentIds(database: string) {
        return this.documentIds(database, 'ldesfragment');
    }

    snapshotIds(database: string) {
        return this.documentIds(database, 'snapshot');
    }
}
