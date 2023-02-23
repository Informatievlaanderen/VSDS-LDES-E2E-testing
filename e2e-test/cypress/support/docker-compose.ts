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
    private _isUp: boolean;
    private _environmentFile: string;
    private _environment: object

    constructor(private useDefaultTags: boolean) { }

    public initialize() {
        this._environment = this.initialEnvironment;
        this._environmentFile = '';
        this._isUp = false;
    }

    private get initialEnvironment() {
        const ownCredentials = {
            // Use own credentials
            SINGLE_USER_CREDENTIALS_USERNAME: credentials.username,
            SINGLE_USER_CREDENTIALS_PASSWORD: credentials.password,
        };

        const latestTags = {
            // Use latest tags
            GTFS2LDES_TAG: 'main',
            JSON_DATA_GENERATOR_TAG: 'latest',
            LDES_CLIENT_CLI_TAG: 'latest',
            LDES_CLIENT_SINK_TAG: 'latest',
            LDES_SERVER_SIMULATOR_TAG: 'latest',
            LDES_SERVER_TAG: 'latest',
            LDES_WORKBENCH_NIFI_TAG: 'latest',
            MONGODB_REST_API_TAG: 'latest',
            MONGODB_TAG: 'latest',
            NGINX_TAG: 'latest',
        }

        return this.useDefaultTags ? { ...ownCredentials } : { ...ownCredentials, ...latestTags };
    }

    public up(options: Partial<DockerComposeOptions>) {
        if (options.dockerComposeFile) {
            this._environment['COMPOSE_FILE'] = options.dockerComposeFile;
        }

        if (options.environmentFile) {
            this._environmentFile = options.environmentFile;
        }

        if (options.additionalEnvironmentSetting) {
            this._environment = {
                ...this._environment,
                ...options.additionalEnvironmentSetting
            };
        }

        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const delayedService = options.delayedService ? options.delayedService : ''
        const command = `docker compose ${environmentFile} up ${delayedService} -d`;
        return cy.log(`Using latest tags: ${!this.useDefaultTags}`)
            .exec(command, { log: true, env: this._environment }).then(result => {
                this._isUp = result.code === 0;
                return result;
            });
    }

    private waitNoContainersRunning() {
        return cy.waitUntil(() => cy.exec('docker ps').then(result => !result.stdout.includes('\n')), { timeout: 60000, interval: 5000 })
    }

    public down() {
        if (this._isUp) {
            const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
            const command = `docker compose ${environmentFile} down`;
            return cy.exec(command, { log: true, env: this._environment, timeout: 60000 })
                .then(exec => expect(exec.code).to.equals(0))
                .then(() => this.waitNoContainersRunning().then(() => this._isUp = false));
        }
    }
}