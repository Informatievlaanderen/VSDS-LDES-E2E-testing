/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";

export class Gtfs2Ldes implements CanCheckAvailability {

    public get serviceName() {
        return 'gtfs2ldes-js'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Starting processing of GTFS source"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`).then(result => cy.waitUntil(
            () => this.isReady(result.stdout), 
            { timeout: timeouts.ready, interval: timeouts.check, errorMsg: `Timed out waiting for container '${this.serviceName}' to be available` }
        ));
    }

    private isPostingConnections(containerId: string) {
        return cy.exec(`docker logs -n 1 ${containerId}`).then(result => result.stdout.startsWith('Posted'));
    }

    waitSendingLinkedConnections() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`).then(result => cy.waitUntil(
            () => this.isPostingConnections(result.stdout), 
            { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for container '${this.serviceName}' to start sending connections` }
            ));
    }

    sendLinkedConnectionCount(): Cypress.Chainable<number> {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`).then(result =>
            cy.exec(`docker logs -n 1 ${result.stdout}`)
                .then(result => result.stdout)
                .then(lastLine => lastLine.startsWith('Posted') ? Number.parseInt(lastLine.replace(/[^0-9]/g, '')): 0)
        );
    }
}