/// <reference types="cypress" />

interface CollectionCount {
    total: number;
}

interface SinkResult {
    [key: string]: CollectionCount;
}

export class TestMessageSink {
    constructor(private baseUrl: string) { }

    checkCount(collectionName: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(collectionName, count, checkFn), { timeout: 120000, interval: 5000 });
    }

    private hasCount(collectionName: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(this.baseUrl).
            then(response => response.body).
            then((result: SinkResult) => 
                cy.log('Actual count: ' + result[collectionName].total).then(() => checkFn(result[collectionName].total, count))
            );
    }

    public deleteMember() {
        return cy.exec(`curl -X DELETE ${this.baseUrl}/member`).then(exec => expect(exec.code).to.equals(0));
    }
}