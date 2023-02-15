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

    private environmentFile: string;

    public up(options: DockerComposeOptions = undefined, delayedService: string = '') {
        if (options) {
            this.environmentFile = options.environmentFile;
            this.env = {
                ...this.env,
                COMPOSE_FILE: options.dockerComposeFile,
                ...options.additionalEnvironmentSetting
            };
        }
        const envFile = this.environmentFile ? `--env-file ${this.environmentFile}` : '';
        const command = `docker compose ${envFile} up ${delayedService} -d`;
        return cy.exec(command, { log: true, env: this.env });
    }

    public down() {
        return cy.exec('docker compose down', { log: true, env: this.env, timeout: 60000 }).then(exec => expect(exec.code).to.equals(0));;
    }
}