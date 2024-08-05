/// <reference types="cypress" />

import 'cypress-wait-until';
import { checkSuccess, timeouts } from './common';

export interface EnvironmentSettings {
    [key: string]: any
};

export interface DockerComposeOptions {
    dockerComposeFile: string,
    environmentFile: string,
    environment: EnvironmentSettings
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

        if (options.environment) {
            this._environment = {
                ...this._environment,
                ...options.environment
            };
        }

        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} up -d --wait`;
        return cy.log(command)
            .exec(command, { log: true, env: this._environment, failOnNonZeroExit: false, timeout: timeouts.dockerPull })
            .then(result => checkSuccess(result).then(success => this._isUp = success));
    }

    public cleanup() {
        this._delayedServices.reverse().forEach((x: string) => this.stopContainerAndRemoveVolumesAndImage(x));
        this._delayedServices = [];
        return this.down();
    }

    public create(serviceName: string, environment?: EnvironmentSettings) {
        if (environment) {
            this._environment = {
                ...this._environment,
                ...environment
            };
        }
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} create ${serviceName}`;
        return cy.log(this.userEnvironment ? `Using user environment: ${this.userEnvironment}` : 'No user env.')
            .log(command)
            .exec(command, { log: true, env: this._environment, failOnNonZeroExit: false, timeout: timeouts.dockerPull })
            .then(result => checkSuccess(result).then(success => {
                this._delayedServices.push(serviceName);
                expect(success).to.be.true;
            }));
    }

    public start(serviceName: string, cwd: string, environment?: EnvironmentSettings) {
        if (environment) {
            this._environment = {
                ...this._environment,
                ...environment
            };
        }
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        //NOTE: we cannot use docker compose start because this doesn't work on Mac
        const command = `cd ${cwd} && docker compose ${environmentFile} up ${serviceName} -d`;
        return cy.log(command).exec(command, { log: true, env: this._environment, failOnNonZeroExit: false, timeout: timeouts.exec })
            .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
    }

    public stop(serviceName: string, cwd: string) {
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `cd ${cwd} && docker compose ${environmentFile} stop ${serviceName}`;
        return cy.log(command).exec(command, { log: true, env: this._environment, failOnNonZeroExit: false, timeout: timeouts.exec })
            .then(result => checkSuccess(result).then(success => expect(success).to.be.true))
            .then(() => this.waitServiceStopped(serviceName));
    }

    private waitNoContainersRunning() {
        return cy.waitUntil(() => cy.exec('docker ps').then(result => !result.stdout.includes('\n')), { timeout: timeouts.exec, interval: timeouts.check, errorMsg: 'Timed out waiting for no containers running' })
    }

    private waitServiceStopped(serviceName: string) {
        return cy.waitUntil(() => cy.exec('docker ps').then(result => !result.stdout.includes(serviceName)), { timeout: timeouts.exec, interval: timeouts.check, errorMsg: `Timed out waiting for container '${serviceName}' to stop` })
    }

    private down() {
        if (this._isUp) {
            const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
            const command = `docker compose ${environmentFile} down`;
            return cy.log(command).exec(command, { log: true, env: this._environment, failOnNonZeroExit: false, timeout: timeouts.exec })
                .then(result => checkSuccess(result).then(success => expect(success).to.be.true))
                .then(() => this.waitNoContainersRunning().then(() => this._isUp = false));
        } else {
            return cy.log('No docker containers running.');
        }
    }

    public stopContainerAndRemoveVolumesAndImage(serviceName: string) {
        const environmentFile = this._environmentFile ? `--env-file ${this._environmentFile}` : '';
        const command = `docker compose ${environmentFile} rm --stop --force --volumes ${serviceName}`;
        return cy.log(command).exec(command, { log: true, env: this._environment, failOnNonZeroExit: false, timeout: timeouts.exec })
            .then(result => checkSuccess(result).then(success => expect(success).to.be.true))
            .then(() => this.waitServiceStopped(serviceName));
    }

    createVolume(volumeName: string) {
        const cmd = `docker volume create ${volumeName}`;
        cy.log(cmd).exec(cmd, {failOnNonZeroExit: false}).then(result => checkSuccess(result));
    }

    removeVolume(volumeName: string) {
        const cmd = `docker volume rm ${volumeName}`;
        cy.log(cmd).exec(cmd, {failOnNonZeroExit: false}).then(result => checkSuccess(result));
    }
}