import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, dockerCompose, waitUntilMemberCountStable } from "./common_step_definitions";
import { LdesServer } from "../services";

const oldServer = new LdesServer('http://localhost:8080', 'old-ldes-server');
const newServer = new LdesServer('http://localhost:8080', 'new-ldes-server');

const commonMongoProperties = ['_id', '_class']
const commonFragmentProperties = [...commonMongoProperties, 'fragmentPairs', 'immutable', 'relations', 'root', 'viewName'];
const fragmentCollectionUrl = 'http://localhost:9019/iow_devices/ldesfragment';
const memberCollectionUrl = 'http://localhost:9019/iow_devices/ldesmember';
const evenstreamsCollectionUrl = 'http://localhost:9019/iow_devices/eventstreams';
const viewCollectionUrl = 'http://localhost:9019/iow_devices/view';
const shaclShapeCollectionUrl = 'http://localhost:9019/iow_devices/shacl_shape';

function checkDatabaseStructure(collectionUrl: string, expected: string[],) {
    cy.request(`${collectionUrl}?includeDocuments=true`).then(response => {
        const actual = response.body.documents
            .map(x => Object.keys(x))
            .flat()
            .filter((x, i, a) => a.indexOf(x) === i);
        expect(actual).to.have.same.members(expected);
    });
}

Given('the ldesfragment collection is structured as expected', () => {
    checkDatabaseStructure(fragmentCollectionUrl, [...commonFragmentProperties, 'members']);
})

Given('the ldesmember collection is structured as expected', () => {
    checkDatabaseStructure(memberCollectionUrl, [...commonMongoProperties, 'ldesMember']);
})

Given('the old LDES server is available', () => {
    return oldServer.waitAvailable(LdesServer.ApplicationStarted, 1);
})

Then('the ldesfragment collection is upgraded as expected', () => {
    checkDatabaseStructure(fragmentCollectionUrl, 
        [...commonFragmentProperties, 'collectionName', 'numberOfMembers', 'parentId']);
})

Then('the ldesmember collection is upgraded as expected', () => {
    checkDatabaseStructure(memberCollectionUrl, 
        [...commonMongoProperties, 'collectionName', 'model', 'sequenceNr', 'timestamp', 'treeNodeReferences', 'versionOf']);
})

Then('the eventstreams collection is upgraded as expected', () => {
    checkDatabaseStructure(evenstreamsCollectionUrl,
        [...commonMongoProperties, 'memberType', 'timestampPath', 'versionOfPath']);
})

Then('the view collection is upgraded as expected', () => {
    checkDatabaseStructure(viewCollectionUrl,
        [...commonMongoProperties, 'fragmentations', 'retentionPolicies']);
})

Then('the shacl_shape collection is upgraded as expected', () => {
    checkDatabaseStructure(shaclShapeCollectionUrl,
        [...commonMongoProperties, 'model']);
})

Then('the id of ldesmember has the collectionName {string} as prefix', (collectionName: string) => {
    cy.request(`${memberCollectionUrl}?includeDocuments=true`).then(response => {
        expect(response.body.documents[0]._id).to.have.string(collectionName + "/");
    });
})

When('the old server is done processing', waitUntilMemberCountStable);

When('I bring the old server down', () => {
    dockerCompose.stopContainerAndRemoveVolumesAndImage(oldServer.serviceName);
})

When('I start the new LDES Server', () => {
    createAndStartService(newServer.serviceName).then(() => newServer.waitAvailable());
})
