/// <reference types="cypress" />

import { EventStream } from '../ldes';

export class LdesServer {

    constructor(public baseUrl: string, private _serviceName?: string) { }
    
    public get serviceName() {
        return this._serviceName || 'ldes-server';
    }

    private isReady() {
        return cy.exec(`docker logs $(docker ps -f "name=${this.serviceName}" -q)`)
            .then(result => result.stdout.includes("Tomcat started on port(s): 8080 (http) with context path ''"));
    }

    waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: 60000, interval: 5000 });
    }


    getLdes(collection: string) {
        return new EventStream(`${this.baseUrl}/${collection}`).visit();
    }
    
}
