/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Member } from '../ldes';
import { LdesServer } from "../services";
import { workbenchNifi, mongo, testPartialPath } from "./common_step_definitions";

let rootFragment: Fragment;
const devicesServer = new LdesServer('http://localhost:8071', 'ldes-server-devices');
const modelsServer = new LdesServer('http://localhost:8072', 'ldes-server-models');
const observationsServer = new LdesServer('http://localhost:8073', 'ldes-server-observations');
const multiLdesServer = new LdesServer('http://localhost:8071', 'ldes-server');

// Given stuff

Given('the IoW LDES servers are available', () => {
    devicesServer.waitAvailable();
    modelsServer.waitAvailable();
    observationsServer.waitAvailable();
})

Given('the IoW multi LDES server is available', () => {
    multiLdesServer.waitAvailable();
})

Given('I started the workflow', () => {
    workbenchNifi.pushStart();
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

When('I upload the data file {string} to the LDIO workflow', (baseName: string) => {
    const port = baseName === 'device' ? 9012 : 9013;
    postToLdioWorkflow(baseName, port, 'data');
})

When('I upload the data file {string} to the LDIO workflow with endpoint {string}',
    (baseName: string, endpoint: string) => {
    postToLdioWorkflow(baseName, 9012, endpoint);
})

function postToLdioWorkflow(baseName: string, port: number, endpoint: string) {
    const command = `curl -X POST "http://localhost:${port}/${endpoint}" -H "Content-Type: application/json" -d "@${testPartialPath()}/data/${baseName}.json"`;
    cy.log(command).then(() => cy.exec(command));
}

When('the {string} LDES contains 1 member', (ldes: string) => {
    const useDevices = ldes === 'devices';
    const database = useDevices ? 'iow_devices' : 'iow_models';
    const server = useDevices ? devicesServer : modelsServer;
    verifyMemberCount(database, server, 1);
})

When('the multi LDES server contains {int} members', (count: number) => {
    verifyMemberCount('iow', multiLdesServer, count);
})

function verifyMemberCount(database: string, server: LdesServer, count: number, checkFn?: (actual: number, expected: number) => boolean) {
    mongo.checkCount(database, 'ldesmember', count, checkFn);
}

When('the root fragment of {string} is obtained', (ldes: string) => {
    let server;
    switch (ldes) {
        case 'device-models': server = modelsServer; break;
        case 'devices': server = devicesServer; break;
        case 'water-quality-observations': server = observationsServer; break;
    }
    obtainRootFragment(server, ldes);
})

When('the root fragment of {string} is obtained from the multi LDES server', (ldes: string) => {
    obtainRootFragment(multiLdesServer, ldes);
})

function obtainRootFragment(server: LdesServer, ldes: string) {
    return server.getLdes(ldes)
        .then(ldes => new Fragment(ldes.viewUrl('by-time')).visit())
        .then(view => new Fragment(view.relation.link).visit())
        .then(fragment => rootFragment = fragment);
}

When('the observations LDES contains at least 1 members', () => {
    verifyMemberCount('iow_observations', observationsServer, 1, (x, y) => x >= y);
})

When('the multi LDES server contains at least 3 members', () => {
    verifyMemberCount('iow', multiLdesServer, 3, (x, y) => x >= y);
})

// Then stuff

function logMember(member: Member) {
    cy.log(`Found member ${member.id}, generated at ${member.generatedAtTime} which is version of ${member.isVersionOf}`);
}

function validateType(member: Member, type: string) {
    expect(member.type).to.equal(type);
}

function validateVersionAndTime(member: Member) {
    const idParts = member.id.split('/');
    const stateObjectId = idParts[0];
    const timestampValue = idParts[1];
    expect(member.isVersionOf).to.equal(stateObjectId);
    // expect(member.generatedAtTime).to.equal(timestampValue); // TODO: re-enable when NiFi workflow fixed
    return timestampValue;
}

Then('the root fragment contains a correct NGSI-LD device model version', () => {
    expect(rootFragment.memberCount).to.equal(1);
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/DeviceModel');
    validateVersionAndTime(member);
});

Then('the root fragment contains a correct NGSI-LD device version', () => {
    expect(rootFragment.memberCount).to.equal(1);
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/Device');
    validateVersionAndTime(member);
});

Then('the root fragment contains a correct NGSI-LD observation version', () => {
    expect(rootFragment.memberCount >= 1).to.be.true;
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/WaterQualityObserved');
    validateVersionAndTime(member);
})

Then('the root fragment contains a correct OSLO observation version', () => {
    expect(rootFragment.memberCount >= 1).to.be.true;
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'http://www.w3.org/ns/sosa/ObservationCollection');
    const timestampValue = validateVersionAndTime(member);
    //expect(member.property(sosa.phenomenonTime)).to.equal(timestampValue); // TODO: re-enable when NiFi workflow fixed
});

