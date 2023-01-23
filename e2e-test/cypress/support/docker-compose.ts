/// <reference types="cypress" />

import {credentials} from './credentials'
import 'cypress-wait-until';

export class DockerCompose {
    
    constructor(file: string, private env: object) {
        this.env = { 
            ... this.env,
            COMPOSE_FILE: file,
            SINGLE_USER_CREDENTIALS_USERNAME: credentials.username,
            SINGLE_USER_CREDENTIALS_PASSWORD: credentials.password,
            // TEMP: set tags
            LDES_WORKBENCH_NIFI_TAG:"latest",
            LDES_SERVER_SIMULATOR_TAG:"latest",
            LDES_CLIENT_SINK_TAG:"latest",
        }
    }

    public up(isReady?: () => Cypress.Chainable<boolean>) {
        return cy.exec('docker compose up -d', {log:true, env: this.env}).then(() => {
            if(isReady) {
                cy.waitUntil(() => isReady(), {timeout: 60000, interval: 5000});
            }
        });
    }

    public down() {
        return cy.exec('docker compose down', {log:true, env: this.env});
    }

}