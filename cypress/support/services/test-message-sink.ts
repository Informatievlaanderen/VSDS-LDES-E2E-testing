/// <reference types="cypress" />

import { timeouts } from "../common";

interface CollectionCount {
    total: number;
}

interface SinkResult {
    [key: string]: CollectionCount;
}

export class TestMessageSink {

    constructor(private baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'test-message-sink';
    }

    checkCount(collectionName: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(collectionName, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for document collection '${collectionName}' in test sink to correctly compare to ${count}` });
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

    public checkLogHasNoWarnings(warning: string = '') {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => cy.exec(`docker logs ${result.stdout}`).then(result => expect(result.stdout.includes(`[WARNING] ${warning}`)).to.be.false));
    }
}