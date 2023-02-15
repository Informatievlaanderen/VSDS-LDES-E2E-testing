/// <reference types="cypress" />

import { credentials } from './credentials'
import 'cypress-wait-until';

export interface EnvironmentSettings { 
    [key: string]: any 
};

export interface DockerComposeOptions {
    dockerComposeFile: string, 
    environmentFile?: string, 
    additionalEnvironmentSetting?: EnvironmentSettings
};

export class DockerCompose {
    private env: object = {
        // Use own credentials
        SINGLE_USER_CREDENTIALS_USERNAME: credentials.username,
        SINGLE_USER_CREDENTIALS_PASSWORD: credentials.password,

        // Use latest tags
        // LDES_SERVER_SIMULATOR_TAG:'latest',
        // LDES_WORKBENCH_NIFI_TAG:'latest',
        // LDES_CLIENT_SINK_TAG:'latest',
        // MONGODB_TAG:'latest',
        // LDES_SERVER_TAG:'latest',
        // MONGODB_REST_API_TAG:'latest',
    };

    public up(options: DockerComposeOptions) {
        this.env = {
            COMPOSE_FILE: options.dockerComposeFile,
            ...this.env,
            ...options.additionalEnvironmentSetting
        };
        const command = options.environmentFile ? `docker compose --env-file ${options.environmentFile} up -d` : 'docker compose up -d';
        return cy.exec(command, { log: true, env: this.env });
    }

    public down() {
        return cy.exec('docker compose down', { log: true, env: this.env, timeout: 60000 }).then(exec => expect(exec.code).to.equals(0));;
    }
}