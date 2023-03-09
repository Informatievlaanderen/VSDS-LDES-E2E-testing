/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class Gtfs2Ldes implements CanCheckAvailability {

    private _containerId: string;

    public get serviceName() {
        return 'gtfs2ldes-js'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Connection updates so far"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                this._containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(this._containerId), { timeout: 60000, interval: 5000 });
            });
    }

    getAmountOfConnections() {
        return cy.exec(`docker logs -n 1 ${this._containerId}`)
            .then(result => {
                const lastLine = result.stdout;
                return lastLine.startsWith('Posted')? Number.parseInt(lastLine.replace(/[^0-9]/g, '')) : undefined;
            });
    }
}