/// <reference types="cypress" />
import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Member, sosa } from '../ldes';
import { testPartialPath, obtainRootFragment, byPage, waitForFragment } from "./common_step_definitions";
import { timeouts } from "../common";

// When

When('I upload the data file {string} to the workbench', (baseName: string) => {
    const fileName = `${testPartialPath()}/data/${baseName}.json`;
    const url = `http://localhost:8081/${baseName}s-pipeline`;
    return cy.readFile(fileName, 'utf8').then(data => 
        cy.waitUntil(() => 
            cy.request({method: 'POST', url: url, headers: { 'Content-Type': 'application/json' }, body: data, failOnStatusCode: false })
                .then(response => 200 <= response.status && response.status < 300), 
            {timeout: timeouts.fastAction, interval: timeouts.fastCheck, errorMsg: `Timed out waiting for upload of file '${fileName}' to '${url}' to succeed`}));
})

let rootFragment: Fragment;
When('the root fragment of {string} is obtained', (ldes: string) => {
    obtainRootFragment(ldes, byPage).then(fragment => fragment.visit()).then(fragment => rootFragment = fragment);
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
    waitForFragment(rootFragment, x => x.memberCount === 1, 'have one member');
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/DeviceModel');
    validateVersionAndTime(member);
});

Then('the root fragment contains a correct NGSI-LD device version', () => {
    waitForFragment(rootFragment, x => x.memberCount === 1, 'have one member');
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/Device');
    validateVersionAndTime(member);
});

Then('the root fragment contains a correct NGSI-LD observation version', () => {
    waitForFragment(rootFragment, x => x.memberCount >= 1, 'have at least one member');
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'https://uri.etsi.org/ngsi-ld/default-context/WaterQualityObserved');
    validateVersionAndTime(member);
})

Then('the root fragment contains a correct OSLO observation version', () => {
    waitForFragment(rootFragment, x => x.memberCount >= 1, 'have at least one member');
    const member = rootFragment.members[0];
    logMember(member);
    validateType(member, 'http://www.w3.org/ns/sosa/ObservationCollection');
    const timestampValue = validateVersionAndTime(member);
    expect(member.property(sosa.phenomenonTime)).to.equal(timestampValue);
});

