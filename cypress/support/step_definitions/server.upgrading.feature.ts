import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, dockerCompose, waitUntilMemberCountStable } from "./common_step_definitions";
import { LdesServer } from "../services";

const oldServer = new LdesServer('http://localhost:8080', 'old-ldes-server');
const newServer = new LdesServer('http://localhost:8080', 'new-ldes-server');

const commonFragmentProperties = ['_class', 'fragmentPairs', 'immutable', 'relations', 'root', 'viewName'];
const commonMemberProperties = ['_class'];
const fragmentCollectionUrl = 'http://localhost:9019/iow_devices/ldesfragment';
const memberCollectionUrl = 'http://localhost:9019/iow_devices/ldesmember';

function checkDatabaseStructure(collectionUrl: string, expected: string[],) {
    cy.request(`${collectionUrl}?includeDocuments=true`).then(response => {
        const actual = response.body.documents
            .map(x => Object.keys(x))
            .flat()
            .filter((x, i, a) => a.indexOf(x) === i)
            .filter(x => x !== '_id');
        expect(actual).to.have.same.members(expected);
    });
}

Given('the ldesfragment collection is structured as expected', () => {
    checkDatabaseStructure(fragmentCollectionUrl, [...commonFragmentProperties, 'members']);
})

Given('the ldesmember collection is structured as expected', () => {
    checkDatabaseStructure(memberCollectionUrl, [...commonMemberProperties, 'ldesMember']);
})

Given('the old LDES server is available', () => {
    return oldServer.waitAvailable(LdesServer.ApplicationStarted, 1);
})

Then('the ldesfragment collection is upgraded as expected', () => {
    checkDatabaseStructure(fragmentCollectionUrl, 
        [...commonFragmentProperties, 'collectionName', 'immutableTimestamp', 'numberOfMembers', 'parentId', 'softDeleted']);
})

Then('the ldesmember collection is upgraded as expected', () => {
    checkDatabaseStructure(memberCollectionUrl, 
        [...commonMemberProperties, 'collectionName', 'model', 'sequenceNr', 'treeNodeReferences']);
})

When('the old server is done processing', waitUntilMemberCountStable);

When('I bring the old server down', () => {
    dockerCompose.stopContainerAndRemoveVolumesAndImage(oldServer.serviceName);
})

When('I start the new LDES Server', () => {
    createAndStartService(newServer.serviceName).then(() => newServer.waitAvailable());
})
