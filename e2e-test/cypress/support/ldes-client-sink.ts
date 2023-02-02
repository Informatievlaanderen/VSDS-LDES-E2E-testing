/// <reference types="cypress" />

interface CollectionCount {
    total: number;
}

interface SinkResult {
    [key: string]: CollectionCount;
}

export class LdesClientSink {
    constructor(private baseUrl: string) { }

    checkCount(collectionName: string, count: number) {
        return cy.waitUntil(() => this.hasCount(collectionName, count), { timeout: 120000, interval: 5000 });
    }

    private hasCount(collectionName: string, count: number) {
        return cy.request(this.baseUrl).
            then(response => response.body).
            then((result: SinkResult) => 
                cy.log('Actual count: ' + result[collectionName].total).then(() => 
                    result[collectionName].total === count)
            );
        // NOTE: example for GIPOD tests 2 and 4
        // return cy.request(`http://localhost:9012/GIPOD/${collectionName}`)
        //     .then(response => response.body)
        //     .then((result: { count: number }) => cy.log('Actual count: ' + result.count).then(() => result.count === count));
    }

    public deleteMember() {
        return cy.exec(`curl -X DELETE ${this.baseUrl}/member`).then(exec => expect(exec.code).to.equals(0));
    }
}