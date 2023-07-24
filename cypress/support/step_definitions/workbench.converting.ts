/// <reference types="cypress" />
import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Member, sosa } from '../ldes';
import { testPartialPath, server } from "./common_step_definitions";

const byPage = 'paged';

// When

When('I upload the data file {string} to the workbench', (baseName: string) => {
    cy.waitUntil(() => cy.readFile(`${testPartialPath()}/data/${baseName}.json`, 'utf8').then(data => cy.request({ 
        method: 'POST', 
        url: `http://localhost:8081/${baseName}s-pipeline`, 
        headers: { 'Content-Type': 'application/json' }, 
        body: data,
     }).then(response => 200 <= response.status && response.status < 300)), {timeout: 5000, interval: 1000});
})

let rootFragment: Fragment;
When('the root fragment of {string} is obtained', (ldes: string) => {
    return server.getLdes(ldes)
        .then(ldes => new Fragment(ldes.viewUrl(byPage)).visit())
        .then(view => new Fragment(view.relation.link).visit())
        .then(fragment => rootFragment = fragment);
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
    expect(member.generatedAtTime).to.equal(timestampValue); // TODO: re-enable when NiFi workflow fixed
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
    expect(member.property(sosa.phenomenonTime)).to.equal(timestampValue); // TODO: re-enable when NiFi workflow fixed
});

