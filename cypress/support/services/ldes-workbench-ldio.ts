/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class LdesWorkbenchLdio implements CanCheckAvailability {

    constructor(public baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldio-workbench';
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

    pause() {
        return cy.request({ method: 'POST', url: `${this.baseUrl}/admin/api/v1/pipeline/halt` }).then(response => expect(response.status).to.equal(200));
    }

    resume() {
        return cy.request({ method: 'POST', url: `${this.baseUrl}/admin/api/v1/pipeline/resume` }).then(response => expect(response.status).to.equal(200));
    }
}