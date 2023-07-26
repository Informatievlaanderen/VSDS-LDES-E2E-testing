/// <reference types="cypress" />

import { timeouts } from "../common";
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
        return cy.waitUntil(() => this.isReady(), { timeout: timeouts.ready, interval: timeouts.check });
    }

    private isReady() {
        return cy.exec(`curl --head ${this.baseUrl}`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
    }

    public seed(files: string[]) {
        files.forEach(file => this.postFragment(file));
    }

    public postFragment(partialFilePath: string, maxAge?: number) {
        const query = maxAge ? `?max-age=${maxAge}` : '';
        return cy.readFile(partialFilePath, 'utf8').then(data => 
            cy.request({
                method: 'POST', 
                url: `${this.baseUrl}/ldes${query}`, 
                headers: { 'Content-Type': 'application/ld+json'}, 
                body: data,
            }).then(response => expect(response.status).to.equal(201)));
    }

    public postAlias(partialFilePath: string) {
        return cy.readFile(partialFilePath, 'utf8').then(data => 
            cy.request({
                method: 'POST', 
                url: `${this.baseUrl}/alias`, 
                headers: { 'Content-Type': 'application/json'}, 
                body: data
            }).then(response => expect(response.status).to.equal(201)));
    }

    public deleteFragments() {
        return cy.request({url: `${this.baseUrl}/ldes`, method: 'DELETE', failOnStatusCode: false}).then(response => expect(response.status).to.equals(200));
    }

    public getResponses() {
        return cy.request(this.baseUrl).then(response => response.body as RootResponse).then(rootResponse => rootResponse.responses);
    }
}
