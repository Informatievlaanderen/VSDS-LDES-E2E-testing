/// <reference types="cypress" />

export class MongoRestApi {
    constructor(private baseUrl: string) { }

    checkCount(database: string, collection: string, count: number) {
        return cy.waitUntil(() => this.hasCount(database, collection, count), { timeout: 120000, interval: 5000 });
    }

    private hasCount(database: string, collection: string, count: number) {
        return cy.request(`${this.baseUrl}/${database}/${collection}`)
            .then(response => response.body)
            .then((result: { count: number }) => cy.log('Actual count: ' + result.count).then(() => result.count === count));
    }
}
