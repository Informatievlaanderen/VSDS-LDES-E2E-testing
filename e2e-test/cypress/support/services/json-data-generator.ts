/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class JsonDataGenerator implements CanCheckAvailability {

    public get serviceName() {
        return 'json-data-generator'
    }

    private isReady() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => cy.exec(`docker logs ${result.stdout}`)
            .then(result => result.stdout.includes('Runs at:')));
    }

    waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: 60000, interval: 5000 });
    }

}