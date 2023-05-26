/// <reference types="cypress" />
import { Given, When } from "@badeball/cypress-cucumber-preprocessor";
import { LdesServer } from "../services";
import { workbenchNifi, mongo, testPartialPath } from "./common_step_definitions";


const devicesServer = new LdesServer('http://localhost:8071', 'ldes-server-devices');
const modelsServer = new LdesServer('http://localhost:8072', 'ldes-server-models');
const observationsServer = new LdesServer('http://localhost:8073', 'ldes-server-observations');

// Given stuff

Given('the IoW LDES servers are available', () => {
    devicesServer.waitAvailable();
    modelsServer.waitAvailable();
    observationsServer.waitAvailable();
})

Given('the {string} ingest endpoint is ready', (baseName: string) => {
    const port = baseName === 'device' ? 9012 : 9013;
    workbenchNifi.waitIngestEndpointAvailable(`http://localhost:${port}/ngsi/${baseName}`);
})

// When stuff

When('I upload the data file {string} to the NiFi workflow', (baseName: string) => {
    const port = baseName === 'device' ? 9012 : 9013;
    const command = `curl -X POST "http://localhost:${port}/ngsi/${baseName}" -H "Content-Type: application/json" -d "@${testPartialPath()}/data/${baseName}.json"`;
    cy.log(command).then(() => cy.exec(command));
})

function verifyMemberCount(database: string, count: number, checkFn?: (actual: number, expected: number) => boolean) {
    mongo.checkCount(database, 'ldesmember', count, checkFn);
}

When('the {string} LDES contains 1 member', (ldes: string) => {
    const useDevices = ldes === 'devices';
    const database = useDevices ? 'iow_devices' : 'iow_models';
    verifyMemberCount(database, 1);
})

When('the observations LDES contains at least 1 members', () => {
    verifyMemberCount('iow_observations', 1, (x, y) => x >= y);
})
