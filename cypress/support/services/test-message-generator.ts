/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class TestMessageGenerator implements CanCheckAvailability {

    public get serviceName() {
        return 'test-message-generator'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Runs at:"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(containerId), { timeout: 60000, interval: 5000 });
            });
    }

}