/// <reference types="cypress" />

import { timeouts } from "../common";

type CountResult = { count: number, ids: string[] };

type FragmentInfo = { _id: string, nrOfMembersAdded: number }
type DocumentResult = { count: number, documents: FragmentInfo[] };

export class PostgresRestApi {
    
    constructor(public baseUrl: string) { }

    checkCount(collection: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(collection, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for document collection '${collection}' to correctly compare to ${count}` });
    }

    checkFragmentMemberCount(fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasFragmentMemberCount(fragment, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for fragment member count of '${fragment}' to correctly compare to ${count}` });
    }

    private hasFragmentMemberCount(fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/fragmentation_fragment?includeDocuments=true`)
        .then(response => response.body)
        .then((body: DocumentResult) => body.documents.find(x => x._id === fragment))
        .then((fragment: FragmentInfo) => cy.log('Actual fragment member count: ' + fragment.nrOfMembersAdded).then(() => checkFn(fragment.nrOfMembersAdded , count)));
    }

    private hasCount(collection: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/${collection}`)
            .then(response => response.body)
            .then((result: CountResult) => cy.log('Actual count: ' + result.count).then(() => checkFn(result.count , count)));
    }

    count(collection: string) {
        return cy.request(`${this.baseUrl}/${collection}`)
            .then(response => response.body)
            .then((result: CountResult) => result.count);
    }

    private documentIds(document: string) {
        return cy.request(`${this.baseUrl}/${document}?includeIds=true`)
                 .then(response => response.body && (response.body.ids as string[]));
    }
}
