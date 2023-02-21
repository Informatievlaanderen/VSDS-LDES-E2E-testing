/// <reference types="cypress" />

import { EventStream } from '../ldes';
import { CanCheckAvailability } from './interfaces';

export class LdesServer implements CanCheckAvailability {

    constructor(public baseUrl: string, private _serviceName?: string) { }
    
    public get serviceName() {
        return this._serviceName || 'ldes-server';
    }

    private isReady() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => cy.exec(`docker logs ${result.stdout}`)
            .then(result => result.stdout.includes("Tomcat started on port(s): 8080 (http) with context path ''")));
    }

    waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: 60000, interval: 5000 });
    }


    getLdes(collection: string) {
        return new EventStream(`${this.baseUrl}/${collection}`).visit();
    }
    
}
