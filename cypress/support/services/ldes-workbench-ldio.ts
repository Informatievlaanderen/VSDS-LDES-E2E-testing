/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class LdesWorkbenchLdio implements CanCheckAvailability {

    constructor(public baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldio-workflow';
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
        return cy.exec(`curl -X POST "${this.baseUrl}/admin/api/v1/pipeline/halt"`)
            .then(exec => expect(exec.code).to.equals(0));
    }

    resume() {
        return cy.exec(`curl -X POST "${this.baseUrl}/admin/api/v1/pipeline/resume"`)
            .then(exec => expect(exec.code).to.equals(0));
    }
}