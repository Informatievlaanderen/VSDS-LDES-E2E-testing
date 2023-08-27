/// <reference types="cypress" />

import { timeouts } from "../common";

type CountResult = { count: number, ids: string[] };

type FragmentInfo = { _id: string, numberOfMembers: number }
type DocumentResult = { count: number, documents: FragmentInfo[] };

export class MongoRestApi {
    
    constructor(public baseUrl: string) { }

    checkCount(database: string, collection: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(database, collection, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for document collection '${database}.${collection}' to correctly compare to ${count}` });
    }

    checkFragmentMemberCount(database: string, fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasFragmentMemberCount(database, fragment, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for fragment member count of '${database} > ${fragment}' to correctly compare to ${count}` });
    }

    private hasFragmentMemberCount(database: string, fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/${database}/fragmentation_fragment?includeDocuments=true`)
        .then(response => response.body)
        .then((body: DocumentResult) => body.documents.find(x => x._id === fragment))
        .then((fragment: FragmentInfo) => cy.log('Actual fragment member count: ' + fragment.numberOfMembers).then(() => checkFn(fragment.numberOfMembers , count)));
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
        return this.documentIds(database, 'fragmentation_fragment');
    }

    snapshotIds(database: string) {
        return this.documentIds(database, 'snapshot');
    }
}
