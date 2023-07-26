/// <reference types="cypress" />

import { timeouts } from "../common";

interface CollectionCount {
    total: number;
}

interface SinkResult {
    [key: string]: CollectionCount;
}

export class TestMessageSink {
    constructor(private baseUrl: string) { }

    checkCount(collectionName: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(collectionName, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck });
    }

    private hasCount(collectionName: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(this.baseUrl).
            then(response => response.body).
            then((result: SinkResult) => 
                cy.log('Actual count: ' + result[collectionName].total).then(() => 
                    checkFn(result[collectionName].total, count))
            );
    }

    public deleteMember() {
        return cy.request({ method: 'DELETE', url: `${this.baseUrl}/member` }).then(response => expect(response.status).to.equal(200));
    }
}