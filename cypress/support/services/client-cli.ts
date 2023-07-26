/// <reference types="cypress" />

import { timeouts } from "../common";
import { LdesWorkbenchLdio } from "./ldes-workbench-ldio";

export class ClientCli extends LdesWorkbenchLdio {

    constructor(baseUrl: string, serviceName?: string) { 
        super(baseUrl, serviceName);
    }

    hasCount(containerId: string, count: number): any {
        return cy.exec(`docker logs ${containerId}`).then(result => {
            const logs = result.stdout;
            const actualCount = (logs.match(new RegExp('http://purl.org/dc/terms/isVersionOf', 'g')) || []).length;
            cy.log('Actual count: ' + actualCount).then(() => actualCount === count)
        });
    }

    checkCount(count: number) {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.hasCount(containerId, count), { timeout: timeouts.ready, interval: timeouts.check });
            });
    }

}
