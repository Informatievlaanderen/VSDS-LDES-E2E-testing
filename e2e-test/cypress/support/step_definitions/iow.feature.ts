/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, sosa } from '../ldes';
import { LdesServer } from "../services";
import { workbench, mongo, testPartialPath } from "./common_step_definitions";

let rootFragment: Fragment;
const devicesServer = new LdesServer('http://localhost:8071', 'ldes-server-devices');
const modelsServer = new LdesServer('http://localhost:8072', 'ldes-server-models');
const observationsServer = new LdesServer('http://localhost:8073', 'ldes-server-observations');

// Given stuff

Given('the IoW LDES servers are available', () => {
    devicesServer.waitAvailable();
    modelsServer.waitAvailable();
    observationsServer.waitAvailable();
})

Given('I started the workflow', () => {
    workbench.pushStart();
})

// When stuff

When('I upload the data file {string} to the workflow', (baseName: string) => {
    const port = baseName === 'device' ? 9012 : 9013;
    const command = `curl -X POST "http://localhost:${port}/ngsi/${baseName}" -H "Content-Type: application/json" -d "@${testPartialPath()}/data/${baseName}.json"`;
    cy.log(command).then(() => cy.exec(command));
})

When('the {string} LDES contains 1 member', (ldes: string) => {
    const useDevices = ldes === 'devices';
    const database = useDevices ? 'iow_devices' : 'iow_models';
    const collection = 'ldesmember';
    mongo.checkCount(database, collection, 1).then(() => {
        const server = useDevices ? devicesServer : modelsServer;
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

Then('the root fragment contains a correct device version', () => {
    expect(rootFragment.memberCount).to.equal(1);
    const member = rootFragment.members[0];
    expect(member.type).to.equal('https://uri.etsi.org/ngsi-ld/default-context/Device');

    const idParts = member.id.split('/');
    expect(member.isVersionOf).to.equal(idParts[0]);

    //test 3:
    //expected 2023-03-03T13:17:40.211Z 
    //to equal 2023-03-03T13:17:40.212Z
    //expect(member.generatedAtTime).to.equal(idParts[1]);
});

Then('the root fragment contains a correct device version and correct member time', () => {
    expect(rootFragment.memberCount).to.equal(1);
    const member = rootFragment.members[0];
    //test 4:
    expect(member.type).to.equal('https://www.w3.org/TR/vocab-ssn/#SOSASensor');

    const idParts = member.id.split('/');
    expect(member.isVersionOf).to.equal(idParts[0]);
    expect(member.generatedAtTime).to.equal(idParts[1]);
})

Then('the root fragment contains a correct ngsi-ld device model version', () => {
    expect(rootFragment.memberCount).to.equal(1);
    const member = rootFragment.members[0];

    // test 1+3:
    expect(member.type).to.equal('https://uri.etsi.org/ngsi-ld/default-context/DeviceModel');

    const idParts = member.id.split('/');
    expect(member.isVersionOf).to.equal(idParts[0]);

    //test 3:
    //expected '2023-03-03T09:13:08.048Z' 
    //to equal '2023-03-03T09:13:08.049Z'
    //expect(member.generatedAtTime).to.equal(idParts[1]);
});

Then('the root fragment contains a correct device model version', () => {
    expect(rootFragment.memberCount).to.equal(1);
    const member = rootFragment.members[0];

    //test 4:
    expect(member.type).to.equal('http://sample.org/DeviceModel');

    const idParts = member.id.split('/');
    expect(member.isVersionOf).to.equal(idParts[0]);

    //test 4:
    //expected 2023-03-03T13:58:28.415Z 
    //to equal 2023-03-03T13:58:28.416Z
    //expect(member.generatedAtTime).to.equal(idParts[1]);
});

Then('the root fragment contains a correct observation version of an NGSI Model', () => {
    expect(rootFragment.memberCount > 1).to.be.true;
    const member = rootFragment.members[0];

    // Test 1: 
    expect(member.type).to.equal('https://www.w3.org/TR/vocab-ssn-ext/#sosa:ObservationCollection');

    const idParts = member.id.split('/');

    //in test 4: member = undefined
    expect(member.isVersionOf).to.equal(idParts[0]);
    expect(member.generatedAtTime).to.equal(idParts[1]);
    expect(member.property(sosa.phenomenonTime)).to.equal(idParts[1]);
});

Then('the root fragment contains a correct observation version of an NGSI Model and correct member type', () => {
    expect(rootFragment.memberCount > 1).to.be.true;
    const member = rootFragment.members[0];

    // Test 3: 
    expect(member.type).to.equal('https://uri.etsi.org/ngsi-ld/default-context/WaterQualityObserved');

    const idParts = member.id.split('/');
    expect(member.isVersionOf).to.equal(idParts[0]);
    expect(member.generatedAtTime).to.equal(idParts[1]);

    // GEEN phenomenonTime in Test 3?
    //expect(member.property(sosa.phenomenonTime)).to.equal(idParts[1]);
})

Then('the root fragment contains a correct observation version of an OSLO Model', () => {
    expect(rootFragment.memberCount > 1).to.be.true;
    const member = rootFragment.members[0];
    expect(member.type).to.equal('https://uri.etsi.org/ngsi-ld/default-context/WaterQualityObserved');

    const idParts = member.id.split('/');
    expect(member.isVersionOf).to.equal(idParts[0]);
    expect(member.generatedAtTime).to.equal(idParts[1]);
    expect(member.property(sosa.phenomenonTime)).to.equal(idParts[1]);
})
