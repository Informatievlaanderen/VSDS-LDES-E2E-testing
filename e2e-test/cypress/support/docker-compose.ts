/// <reference types="cypress" />

import { credentials } from './credentials'
import 'cypress-wait-until';

export interface EnvironmentSettings {
    [key: string]: any
};

export interface DockerComposeOptions {
    dockerComposeFile: string,
    environmentFile: string,
    additionalEnvironmentSetting: EnvironmentSettings,
    delayedService?: string,
};

export class DockerCompose {
    private environmentFile: string;
    private environment: object = {
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

    public up(options: Partial<DockerComposeOptions>) {
        if (options.dockerComposeFile)        {
            this.environment['COMPOSE_FILE'] = options.dockerComposeFile;
        }

        if (options.environmentFile) {
            this.environmentFile = options.environmentFile;
        }

        if (options.additionalEnvironmentSetting) {
            this.environment = {
                ...this.environment,
                ...options.additionalEnvironmentSetting
            };
        }

        const environmentFile = this.environmentFile ? `--env-file ${this.environmentFile}` : '';
        const delayedService = options.delayedService ? options.delayedService : ''
        const command = `docker compose ${environmentFile} up ${delayedService} -d`;
        return cy.exec(command, { log: true, env: this.environment });
    }

    public down() {
        const environmentFile = this.environmentFile ? `--env-file ${this.environmentFile}` : '';
        const command = `docker compose ${environmentFile} down`;
        return cy.exec(command, { log: true, env: this.environment, timeout: 60000 }).then(exec => expect(exec.code).to.equals(0));;
    }
}