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
    private _environment: object;
    private _delayedServices = [];

    constructor(private userEnvironment: EnvironmentSettings) { }

    public initialize() {
        this._environment = this.userEnvironment || {};
        this._environmentFile = '';
        this._isUp = false;
        this._delayedServices = [];
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
        return cy.log(command).exec(command, { log: true, env: this._environment }).then(result => {
            this._isUp = result.code === 0;
            return result;
        });
    }

    public cleanup() {
        this._delayedServices.forEach((x: string) => this.stopContainerAndRemoveVolumesAndImage(x));
        this._delayedServices = [];
        this.down().then(() => this.waitNoContainersRunning());
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
        return cy.log(this.userEnvironment ? `Using user environment: ${this.userEnvironment}` : 'No user env.')
            .log(command)
            .exec(command, { log: true, env: this._environment })
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
        //NOTE: we cannot use docker compose start because this doesn't work on Mac
        const command = `docker compose ${environmentFile} up ${serviceName} -d`;
        return cy.log(command).exec(command, { log: true, env: this._environment })
            .then(result => expect(result.code).to.equal(0))
            .then(() => this._delayedServices.push(serviceName));
    }

    public stop(serviceName: string) {
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} stop ${serviceName}`;
        return cy.log(command).exec(command, { log: true, env: this._environment })
            .then(result => expect(result.code).to.equal(0));
    }

    private waitNoContainersRunning() {
        return cy.waitUntil(() => cy.exec('docker ps').then(result => !result.stdout.includes('\n')), { timeout: 60000, interval: 5000 })
    }

    public down() {
        if (this._isUp) {
            const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
            const command = `docker compose ${environmentFile} down`;
            return cy.log(command).exec(command, { log: true, env: this._environment, timeout: 60000 })
                .then(exec => expect(exec.code).to.equals(0))
                .then(() => this.waitNoContainersRunning().then(() => this._isUp = false));
        }
    }

    public stopContainerAndRemoveVolumesAndImage(serviceName: string) {
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} rm --stop --force --volumes ${serviceName}`;
        return cy.log(command).exec(command, { log: true, env: this._environment })
            .then(result => expect(result.code).to.equal(0));
    }
}