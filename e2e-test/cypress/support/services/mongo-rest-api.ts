/// <reference types="cypress" />

export class MongoRestApi {
    constructor(private baseUrl: string) { }

    checkCount(database: string, collection: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(database, collection, count, checkFn), { timeout: 120000, interval: 5000 });
    }

    private hasCount(database: string, collection: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/${database}/${collection}`)
            .then(response => response.body)
            .then((result: { count: number }) => cy.log('Actual count: ' + result.count).then(() => checkFn(result.count , count)));
    }
}
