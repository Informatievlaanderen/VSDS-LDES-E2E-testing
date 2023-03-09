/// <reference types="cypress" />

import 'cypress-wait-until';

export interface EnvironmentSettings {
    [key: string]: any
};

export interface DockerComposeOptions {
    dockerComposeFile: string,
    environmentFile: string,
    additionalEnvironmentSetting: EnvironmentSettings,
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
        const latestTags = {
            // Use latest tags
            GTFS2LDES_TAG: 'latest',
            JSON_DATA_GENERATOR_TAG: 'latest',
            LDES_CLIENT_CLI_TAG: 'latest', // OBSOLETE
            LDES_CLIENT_SINK_TAG: 'latest',
            LDES_SERVER_SIMULATOR_TAG: 'latest',
            LDES_SERVER_TAG: 'latest',
            LDES_WORKBENCH_NIFI_TAG: 'latest', // OBSOLETE
            LDI_WORKBENCH_NIFI_TAG: 'latest',
            LDI_ORCHESTRATOR_TAG: '20230303T1028', // TODO: change to latest
            MONGODB_REST_API_TAG: 'latest',
            MONGODB_TAG: 'latest',
            NGINX_TAG: 'latest',
        }

        return this.useDefaultTags ? { } : { ...latestTags };
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
        const command = `docker compose ${environmentFile} up -d`;
        return cy.log(`Using latest tags: ${!this.useDefaultTags}`)
            .exec(command, { log: true, env: this._environment }).then(result => {
                this._isUp = result.code === 0;
                return result;
            });
    }

    public create(serviceName: string, additionalEnvironmentSettings?: EnvironmentSettings) {
        if (additionalEnvironmentSettings) {
            this._environment = {
                ...this._environment,
                ...additionalEnvironmentSettings
            };
        }
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} create ${serviceName}`;
        return cy.exec(command, { log: true, env: this._environment })
            .then(result => expect(result.code).to.equal(0));
    }

    public start(serviceName: string, additionalEnvironmentSettings?: EnvironmentSettings) {
        if (additionalEnvironmentSettings) {
            this._environment = {
                ...this._environment,
                ...additionalEnvironmentSettings
            };
        }
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} start ${serviceName}`;
        return cy.exec(command, { log: true, env: this._environment })
            .then(result => expect(result.code).to.equal(0));
    }

    public stop(serviceName: string) {
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} stop ${serviceName}`;
        return cy.exec(command, { log: true, env: this._environment })
            .then(result => expect(result.code).to.equal(0));
    }

    private waitNoContainersRunning() {
        return cy.waitUntil(() => cy.exec('docker ps').then(result => !result.stdout.includes('\n')), { timeout: 60000, interval: 5000 })
    }

    public down(profile?: string) {
        if (this._isUp) {
            const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
            const command = profile 
                ? `docker compose ${environmentFile} --profile ${profile} down` 
                : `docker compose ${environmentFile} down`;
            return cy.exec(command, { log: true, env: this._environment, timeout: 60000 })
                .then(exec => expect(exec.code).to.equals(0))
                .then(() => this.waitNoContainersRunning().then(() => this._isUp = false));
        }
    }
}