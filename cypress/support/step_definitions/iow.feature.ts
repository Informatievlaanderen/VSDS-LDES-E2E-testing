/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Member, sosa } from '../ldes';
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

When('I upload the data file {string} to the LDIO workflow with port {int}', (baseName: string, port: number) => {
    const command = `curl -X POST "http://localhost:${port}/models" -H "Content-Type: application/json" -d "@${testPartialPath()}/data/${baseName}.json"`;
    cy.log(command).then(() => cy.exec(command));
})

When('the {string} LDES contains 1 member', (ldes: string) => {
    const useDevices = ldes === 'devices';
    const database = useDevices ? 'iow_devices' : 'iow_models';
    const collection = 'ldesmember';
    mongo.checkCount(database, collection, 1).then(() => {
        const server = multiLdesServer;
        // const server = useDevices ? devicesServer : modelsServer;
        return server.getLdes(ldes)
            .then(ldes => new Fragment(ldes.viewUrl('by-time')).visit())
            .then(view => new Fragment(view.relation.link).visit())
            .then(fragment => rootFragment = fragment);
    });
})

When('the observations LDES contains at least 1 members', () => {
    mongo.checkCount('iow_observations', 'ldesmember', 1, (x, y) => x >= y).then(() =>
        observationsServer.getLdes('water-quality-observations')
            .then(ldes => new Fragment(ldes.viewUrl('by-time')).visit())
            .then(view => new Fragment(view.relation.link).visit())
            .then(fragment => rootFragment = fragment));
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

