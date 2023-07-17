/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class Gtfs2Ldes implements CanCheckAvailability {

    private _containerId: string;

    public get serviceName() {
        return 'gtfs2ldes-js'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Starting processing of GTFS source"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                this._containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(this._containerId), { timeout: 15000, interval: 3000 });
            });
    }

    private isPostingConnections() {
        return cy.exec(`docker logs -n 1 ${this._containerId}`).then(result => result.stdout.startsWith('Posted'));
    }

    waitSendingLinkedConnections() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                this._containerId = result.stdout;
                return cy.waitUntil(() => this.isPostingConnections(), { timeout: 600000, interval: 5000 });
            });
    }

    sendLinkedConnectionCount(): Cypress.Chainable<number> {
        return cy.exec(`docker logs -n 1 ${this._containerId}`)
            .then(result => result.stdout)
            .then(lastLine => lastLine.startsWith('Posted')
                ? Number.parseInt(lastLine.replace(/[^0-9]/g, ''))
                : 0
            );
    }
}