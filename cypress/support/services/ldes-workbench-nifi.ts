/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";

const defaultCredentials = {
    username:'administrator',
    password:'Pwd4Admin_DoNotChangeMe'
}

interface NiFiProcessGroup {
    id: string;
}

export class LdesWorkbenchNiFi implements CanCheckAvailability {
    constructor(private baseUrl: string, private _serviceName?: string) {
    }

    public get serviceName() {
        return this._serviceName || 'nifi-workbench';
    }

    get apiUrl() {
        return `${this.baseUrl}/nifi-api`;
    }

    /**
     * Checks if the Apache NiFi workbench is ready to accept login attempts
     * @returns true if ready, false otherwise
     */
    private isReady(): Cypress.Chainable<boolean> {
        return cy.exec(`curl --insecure -I ${this.baseUrl}/nifi/#/login`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
    }

    waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: timeouts.slowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for container '${this.serviceName}' to be available` });
    }

    private isIngestEndpointReady(ingestUrl: string): any {
        return cy.request({ url: `${ingestUrl}/healthcheck`, failOnStatusCode: false })
            .then(response => response.isOkStatusCode && response.body === 'OK');
    }

    waitIngestEndpointAvailable(ingestUrl: string) {
        return cy.waitUntil(() => this.isIngestEndpointReady(ingestUrl), { timeout: timeouts.ready, interval: timeouts.check, errorMsg: `Timed out waiting for ingest endpoint '${ingestUrl}' to be available` });
    }

    requestAccessToken(credentials: { username: string; password: string; } = defaultCredentials) {
        const cmd = `curl -s -k -X POST "${this.apiUrl}/access/token" -H "Content-Type: application/x-www-form-urlencoded"\
            --data-urlencode "username=${credentials.username}" --data-urlencode "password=${credentials.password}"`
        return cy.exec(cmd).then(result => result.stdout);
    }

    uploadWorkflow(token: string, clientId: string, workflowDefinition: string) {
      const cmd = `curl -s -k -X POST "${this.apiUrl}/process-groups/root/process-groups/upload" -H "Authorization: Bearer ${token}"\
        -F "groupName=\"nifi-workflow\"" -F "positionX=\"0\"" -F "positionY=\"0\"" -F "clientId=\"${clientId}\"" -F "file=@\"${workflowDefinition}\""`;
        return cy.exec(cmd)
            .then(result => result.stdout)
            .then(body => JSON.parse(body))
            .then((workflow: NiFiProcessGroup) => workflow.id);
    }

    startWorkflow(token: string, workflowId: string) {
        const message = { id: workflowId, state: 'RUNNING' };
        const cmd = `curl -s -k -X PUT "${this.apiUrl}/flow/process-groups/${workflowId}" -H "Authorization: Bearer ${token}"\
            -H "Content-Type: application/json" -d '${JSON.stringify(message)}'`;
            return cy.exec(cmd);
    }

}
