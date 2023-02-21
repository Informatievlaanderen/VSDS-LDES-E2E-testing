/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class LdesServerSimulator implements CanCheckAvailability {
    constructor(private baseUrl: string) { };

    public waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: 15000, interval: 5000 });
    }

    private isReady() {
        return cy.request({
            url: this.baseUrl, 
            failOnStatusCode: false, 
        }).then(response => response.isOkStatusCode);
    }

    public seed(files: string[]) {
        files.forEach(file => this.postFragment(file));
    }

    public postFragment(partialFilePath: string, maxAge?: number) {
        const query = maxAge ? `?max-age=${maxAge}` : '';
        return cy.exec(`curl -X POST "${this.baseUrl}/ldes${query}" -H "Content-Type: application/ld+json" -d "@${partialFilePath}"`)
            .then(exec => expect(exec.code).to.equals(0));
    }

    public postAlias(partialFilePath: string) {
        return cy.exec(`curl -X POST "${this.baseUrl}/alias" -H "Content-Type: application/json" -d "@${partialFilePath}"`)
            .then(exec => expect(exec.code).to.equals(0));
    }

    public deleteFragments() {
        return cy.exec(`curl -X DELETE "${this.baseUrl}/ldes"`).then(exec => expect(exec.code).to.equals(0));
    }

}
