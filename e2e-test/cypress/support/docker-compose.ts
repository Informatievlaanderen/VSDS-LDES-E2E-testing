/// <reference types="cypress" />

import {credentials} from './credentials'
import 'cypress-wait-until';

export class DockerCompose {
    private env: object = { 
        // Use own credentials
        SINGLE_USER_CREDENTIALS_USERNAME: credentials.username,
        SINGLE_USER_CREDENTIALS_PASSWORD: credentials.password,

        // Use latest tags
        LDES_SERVER_SIMULATOR_TAG:'latest',
        LDES_WORKBENCH_NIFI_TAG:'latest',
        LDES_CLIENT_SINK_TAG:'latest',
        MONGODB_TAG:'latest',
        LDES_SERVER_TAG:'latest',
        MONGODB_REST_API_TAG:'latest',
    };

    public up(dockerComposeFile: string, environmentFile?: string) {
        this.env = { ...this.env, COMPOSE_FILE: dockerComposeFile };
        const command = environmentFile ? `docker compose --env-file ${environmentFile} up -d` : 'docker compose up -d';
        return cy.exec(command, {log: true, env: this.env});
    }

    public down() {
        return cy.exec('docker compose down', {log: true, env: this.env, timeout: 60000}).then(exec => expect(exec.code).to.equals(0));;
    }
}