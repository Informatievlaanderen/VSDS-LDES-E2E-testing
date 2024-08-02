/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";

interface StatusResponse { [key: string]: string };

export class LdesWorkbenchLdio implements CanCheckAvailability {

    constructor(public baseUrl: string, private _serviceName?: string) { }

    upload(pipelinePath: string) {
        return cy.readFile(pipelinePath)
            .then(contents => cy.request({
                method: 'POST', url: `${this.baseUrl}/admin/api/v1/pipeline`,
                headers: { 'Content-Type': 'application/yaml' }, body: contents
            }))
            .then(response => expect(response.isOkStatusCode).to.be.true);
    }

    private hasVersionCount(containerId: string, count: number): any {
        return cy.exec(`docker logs ${containerId}`).then(result => {
            const logs = result.stdout;
            const actualCount = (logs.match(new RegExp('http://purl.org/dc/terms/isVersionOf', 'g')) || []).length;
            cy.log('Actual count: ' + actualCount).then(() => actualCount === count)
        });
    }

    checkConsoleCount(count: number) {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.hasVersionCount(containerId, count), { timeout: timeouts.ready, interval: timeouts.check, errorMsg: `Timed out waiting for member count to be ${count}` });
            });
    }

    // TODO: check below this line

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
        return this.waitForDockerLog(this.availabilityMessage);
    }

    waitForPipelinesRunning() {
        return cy.waitUntil(() => this.allPipelinesRunning(),
            { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: 'Timed out waiting for all pipelines to be running' });
    }

    private allPipelinesRunning() {
        return cy.request(`${this.baseUrl}/admin/api/v1/pipeline/status`).then(response => {
            if (response.isOkStatusCode && response.body) {
                const values = Object.values(response.body as StatusResponse);
                return values.length > 0 && values.every(x => x === 'RUNNING');
            }
            return false;
        });
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