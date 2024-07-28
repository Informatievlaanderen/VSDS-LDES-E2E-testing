/// <reference types="cypress" />

import { timeouts } from "../common";

type Page = { page_id: number }

export class PostgresRestApi {

    constructor(public baseUrl: string) { }

    private getResultCount(url: string) {
        return cy.request({ url: url, method: 'HEAD', headers: { 'Prefer': 'count=exact' } })
            .then(response => {
                const header: string | string[] = response.headers['content-range'];
                return Array.isArray(header) ? header.shift() : header;
            })
            .then(x => cy.log('header: ' + x)
                .then(() => x?.split('/').reverse().shift())
                .then((count: string) => (count && Number.parseInt(count)) || 0));
    }

    checkCount(table: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasCount(table, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for document collection '${table}' to correctly compare to ${count}` });
    }

    checkFragmentMemberCount(fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean = (x, y) => x === y) {
        return cy.waitUntil(() => this.hasFragmentMemberCount(fragment, count, checkFn), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for fragment member count of '${fragment}' to correctly compare to ${count}` });
    }

    private hasFragmentMemberCount(fragment: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return cy.request({ url: `${this.baseUrl}/pages?partial_url=eq.${fragment}`, failOnStatusCode: false })
            .then(response => response.body)
            .then((pages: Page[]) => (Array.isArray(pages) && pages.shift()?.page_id) || 0)
            .then((pageId: number) => !!pageId && this.getResultCount(`${this.baseUrl}/page_members?page_id=eq.${pageId}`)
                .then((memberCount: number) => cy.log('Actual fragment member count: ' + memberCount).then(() => checkFn(memberCount, count))));
    }

    private hasCount(table: string, count: number, checkFn: (actual: number, expected: number) => boolean) {
        return this.getResultCount(`${this.baseUrl}/${table}`)
            .then((collectionCount => cy.log('Actual count: ' + collectionCount).then(() => checkFn(collectionCount, count))));
    }

    count(table: string) {
        return this.getResultCount(`${this.baseUrl}/${table}`);
    }
}
