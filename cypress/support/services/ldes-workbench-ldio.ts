/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";

export class LdesWorkbenchLdio implements CanCheckAvailability {

    constructor(public baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldio-workbench';
    }

    protected get availabilityMessage() {
        return "Started Application in";
    }

    private containerLogIncludes(containerId: string, includeString: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes(includeString));
    }

    waitForDockerLog(includeString: string) {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.containerLogIncludes(containerId, includeString), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for container '${this.serviceName}' log to include '${includeString}'` });
            });
    }

    waitAvailable() {
        this.waitForDockerLog(this.availabilityMessage);
    }

    pause(pipeline: string) {
        return cy.request({ method: 'POST', url: `${this.baseUrl}/admin/api/v1/pipeline/${pipeline}/halt` })
            .then(response => expect(response.status).to.equal(200));
    }

    resume(pipeline: string) {
        return cy.request({ method: 'POST', url: `${this.baseUrl}/admin/api/v1/pipeline/${pipeline}/resume` })
            .then(response => expect(response.status).to.equal(200));
    }
}