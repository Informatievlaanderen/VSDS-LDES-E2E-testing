/// <reference types="cypress" />

import { CanCheckAvailability } from "./interfaces";

export class LdesWorkbenchNiFi implements CanCheckAvailability {

    constructor(private baseUrl: string) {
    }

    private _lastUploadedWorkflowId: string;

    /**
     * Checks if the Apache NiFi workbench is ready to accept login attempts
     * @returns true if ready, false otherwise
     */
    private isReady(): Cypress.Chainable<boolean> {
        return cy.exec(`curl ${this.baseUrl}/nifi`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
    }

    private isOldWorkbenchReady(): Cypress.Chainable<boolean> {
        return cy.exec(`curl --insecure -I ${this.baseUrl}/nifi`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
    }

    waitAvailable() {
        return cy.waitUntil(() => this.isReady(), { timeout: 600000, interval: 5000 });
    }

    waitForOldWorkbenchAvailable() {
        return cy.waitUntil(() => this.isOldWorkbenchReady(), { timeout: 600000, interval: 5000 });
    }

    waitIngestEndpointAvailable(ingestUrl: string) {
        return cy.waitUntil(() => this.isIngestEndpointReady(ingestUrl), { timeout: 60000, interval: 5000 });
    }

    private isIngestEndpointReady(ingestUrl: string): any {
        return cy.request({ url: `${ingestUrl}/healthcheck`, failOnStatusCode: false })
            .then(response => response.isOkStatusCode && response.body === 'OK');
    }

    uploadWorkflow(partialPath: string) {
        cy.intercept({url: '**/upload', times: 1}).as('uploaded');
        cy.intercept({url: '/nifi-api/flow/cluster/summary', times: 1}).as('readyToUpload');
        cy.origin(this.baseUrl, { args: {file: partialPath} } , ({file}) => {
            cy.visit('/nifi/').wait('@readyToUpload');

            cy.get("#group-component")
                .trigger("mousedown", 1, 1, {
                    button: 0,
                    force: true,
                    eventConstructor: "MouseEvent"
                })
                .trigger("mousemove", 200, 200, {
                    button: 0,
                    force: true,
                    eventConstructor: "MouseEvent"
                })
                .trigger("mouseup", 200, 200, {
                    button: 0,
                    force: true,
                    eventConstructor: "MouseEvent"
                });

            return cy.readFile(file, 'utf8').then(data => cy.get('#upload-file-field').selectFile({
                        contents: Cypress.Buffer.from(JSON.stringify(data)), 
                        fileName: 'nifi-workflow.json',
                        mimeType: 'application/json',
                        lastModified: Date.now()
                    }, { force: true })
                    .get('#new-process-group-dialog > .dialog-buttons > div').first().click({ force: true })
                    .wait('@uploaded')
                    .then(upload => upload.response.body.id)
                    .then((id: string) => cy.get('#operation-context-id').should('have.text', id).then(() => id))
                );
        }).then((id: string) => this._lastUploadedWorkflowId = id);
    }

    pushStart() {
        cy.origin(this.baseUrl, () => {
            cy.get('#operate-start').click();
        });
    }

    pushStop() {
        cy.origin(this.baseUrl, () => { 
            cy.get('#operate-stop').click();
        });
    }

    openWorkflow() {
        cy.intercept({url: '/nifi-api/flow/cluster/summary', times: 1}).as('readyToOpenWorkflow');
        cy.origin(this.baseUrl, { args: {workflowId: this._lastUploadedWorkflowId} } , ({workflowId}) => {
            cy.visit('/nifi/').wait('@readyToOpenWorkflow');
            cy.get(`#id-${workflowId}`).dblclick();
        });
    }

    selectProcessor(name: string) {
        cy.origin(this.baseUrl, {args: {processorName: name}}, ({processorName}) => {
            cy.get(`g.processor > text > title:contains(${processorName})`).parent().parent().click();
        });
    }

    login(credentials: { username: string; password: string; }) {
        cy.intercept({url: '/nifi-api/flow/cluster/summary', times: 1}).as('loggedIn');
        return cy.origin(this.baseUrl, {args: { credentials }}, ({credentials}) => cy.visit('/nifi/login')
                .get('#username').type(credentials.username)
                .get('#password').type(credentials.password)
                .get('#login-submission-button').click().wait('@loggedIn')
            );
    }

    logout() {
        cy.origin(this.baseUrl, () => {
            cy.visit('/nifi/logout');
            cy.clearCookies();
            cy.clearLocalStorage();
            return cy.clearAllSessionStorage();
        });
    }
}
