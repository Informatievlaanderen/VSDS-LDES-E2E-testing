/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";

export class TestMessageGenerator implements CanCheckAvailability {

    public get serviceName() {
        return 'test-message-generator'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stderr.includes("Runs at:"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(containerId), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for container '${this.serviceName}' to be available` });
            });
    }

}