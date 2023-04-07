/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class LdesWorkbenchLdio implements CanCheckAvailability {

    public get serviceName() {
        return 'ldio-workflow'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Started Application in"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(containerId), { timeout: 30000, interval: 5000 });
            });
    }

}