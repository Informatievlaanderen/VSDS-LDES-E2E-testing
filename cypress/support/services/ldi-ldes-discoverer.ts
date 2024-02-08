/// <reference types="cypress" />

import {CanCheckAvailability} from "./interfaces";
import {timeouts} from "../common";

export class LdiLdesDiscoverer implements CanCheckAvailability {
    constructor(private _serviceName?: string) {
    }

    public get serviceName() {
        return this._serviceName || 'ldes-discoverer';
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
                return cy.waitUntil(() => this.containerLogIncludes(containerId, includeString), {
                    timeout: timeouts.slowAction,
                    interval: timeouts.slowCheck,
                    errorMsg: `Timed out waiting for container '${this.serviceName}' log to include '${includeString}'`
                });
            });
    }

    waitAvailable() {
        this.waitForDockerLog(this.availabilityMessage);
    }

    hasCount(containerId: string, count: number): any {
        return cy.exec(`docker logs ${containerId}`).then(result => {
            const totalOfStr = "Total of ";
            const logs = result.stdout;
            const startIndex = logs.indexOf(totalOfStr) + totalOfStr.length;
            const endIndex = logs.indexOf(" relations found for url");
            const actualCount = Number.parseInt(logs.substring(startIndex, endIndex).trim());
            cy.log(`Actual count: ${actualCount}`).then(() => actualCount === count)
        });
    }

    checkRelationCount(count: number) {
        return cy.exec(`docker ps -qaf "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.hasCount(containerId, count), {
                    timeout: timeouts.ready,
                    interval: timeouts.check,
                    errorMsg: `Timed out waiting for relation count to be ${count}`
                })
            })
    }

}