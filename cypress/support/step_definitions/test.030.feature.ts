/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Member } from '../ldes';
import { LdesServer } from "../services";
import { mongo, testPartialPath } from "./common_step_definitions";


// function logMember(member: Member) {
//     cy.log(`Found member ${member.id}, generated at ${member.generatedAtTime} which is version of ${member.isVersionOf}`);
// }

// function validateType(member: Member, type: string) {
//     expect(member.type).to.equal(type);
// }

// function validateVersionAndTime(member: Member) {
//     const idParts = member.id.split('/');
//     const stateObjectId = idParts[0];
//     const timestampValue = idParts[1];
//     expect(member.isVersionOf).to.equal(stateObjectId);
//     // expect(member.generatedAtTime).to.equal(timestampValue); // TODO: re-enable when NiFi workflow fixed
//     return timestampValue;
// }

// Then('the root fragment contains a correct NGSI-LD device model version', () => {
//     expect(rootFragment.memberCount).to.equal(1);
//     const member = rootFragment.members[0];
//     logMember(member);
//     validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/DeviceModel');
//     validateVersionAndTime(member);
// });

// Then('the root fragment contains a correct NGSI-LD device version', () => {
//     expect(rootFragment.memberCount).to.equal(1);
//     const member = rootFragment.members[0];
//     logMember(member);
//     validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/Device');
//     validateVersionAndTime(member);
// });

// Then('the root fragment contains a correct NGSI-LD observation version', () => {
//     expect(rootFragment.memberCount >= 1).to.be.true;
//     const member = rootFragment.members[0];
//     logMember(member);
//     validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/WaterQualityObserved');
//     validateVersionAndTime(member);
// })

// Then('the root fragment contains a correct OSLO observation version', () => {
//     expect(rootFragment.memberCount >= 1).to.be.true;
//     const member = rootFragment.members[0];
//     logMember(member);
//     validateType(member, 'http://www.w3.org/ns/sosa/ObservationCollection');
//     const timestampValue = validateVersionAndTime(member);
//     //expect(member.property(sosa.phenomenonTime)).to.equal(timestampValue); // TODO: re-enable when NiFi workflow fixed
// });

///////////////////////////////////////////

let rootFragment: Fragment;
const multiLdesServer = new LdesServer('http://localhost:8071', 'ldes-server');

// Given stuff

Given('the IoW multi LDES server is available', () => {
    multiLdesServer.waitAvailable();
})

// When stuff

When('I upload the data file {string} to the LDIO workflow with endpoint {string}',
    (baseName: string, endpoint: string) => {
    postToLdioWorkflow(baseName, 9012, endpoint);
})

function postToLdioWorkflow(baseName: string, port: number, endpoint: string) {
    const command = `curl -X POST "http://localhost:${port}/${endpoint}" -H "Content-Type: application/json" -d "@${testPartialPath()}/data/${baseName}.json"`;
    cy.log(command).then(() => cy.exec(command));
}

When('the multi LDES server contains {int} members', (count: number) => {
    mongo.checkCount('iow', 'ldesmember', count);
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

When('the multi LDES server contains at least 3 members', () => {
    mongo.checkCount('iow', 'ldesmember', 3, (x, y) => x >= y);
})
