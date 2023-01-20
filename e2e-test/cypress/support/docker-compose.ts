/// <reference types="cypress" />

import {credentials} from './credentials'

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

    public up() {
        return cy.exec('docker compose up -d', {log:true, env: this.env});
    }

    public down() {
        return cy.exec('docker compose down', {log:true, env: this.env});
    }

}