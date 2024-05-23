/// <reference types="cypress" />

import { timeouts } from "../common";

type FragmentInfo = { id: string, nr_of_members_added: number }

export class PostgresRestApi {

    constructor(public baseUrl: string) { }

    checkCount(collection: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(collection, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for document collection '${collection}' to correctly compare to ${count}` });
    }

    checkFragmentMemberCount(fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasFragmentMemberCount(fragment, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for fragment member count of '${fragment}' to correctly compare to ${count}` });
    }

    private hasFragmentMemberCount(fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/fragmentation_fragment`)
        .then(response => response.body)
        .then((body: FragmentInfo[]) => body.find(x => x.id === fragment))
        .then((fragment: FragmentInfo) => cy.log('Actual fragment member count: ' + fragment.nr_of_members_added).then(() => checkFn(fragment.nr_of_members_added , count)));
    }

    private hasCount(collection: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request(`${this.baseUrl}/${collection}`)
            .then((response => cy.log('Actual count: ' + response.body.length).then(() => checkFn(response.body.length , count))));
    }

    count(collection: string) {
        return cy.request(`${this.baseUrl}/${collection}`)
            .then(response => response.body.length);
    }
}
