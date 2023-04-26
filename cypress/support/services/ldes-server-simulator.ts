/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";
export interface FragmentResponse {
    count: number;
    at: string[];
}

export interface FragmentResponses {
    [key: string]: FragmentResponse;
}

interface RootResponse {
    aliases: string[];
    fragments: string[];
    responses: FragmentResponses;
}

export class LdesServerSimulator implements CanCheckAvailability {
    constructor(private baseUrl: string) { };

    public waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: 15000, interval: 5000 });
    }

    private isReady() {
        return cy.exec(`curl ${this.baseUrl}`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
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

    public getResponses() {
        return cy.request(this.baseUrl).then(response => response.body as RootResponse).then(rootResponse => rootResponse.responses);
    }
}
