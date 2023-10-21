import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, stopAndRemoveService, mongo, testDatabase, waitUntilMemberCountStable } from "./common_step_definitions";
import { LdesServer } from "../services";
import {EventStream} from "../ldes";

const oldServer = new LdesServer('http://localhost:8080', 'old-ldes-server');
const newServer = new LdesServer('http://localhost:8080', 'new-ldes-server');

const eventstreamsUrl = 'http://localhost:8080/admin/api/v1/eventstreams';

const commonMongoProperties = ['_id', '_class']
const commonFragmentProperties = [...commonMongoProperties, 'fragmentPairs', 'immutable', 'relations', 'root', 'viewName'];

const fragmentationFragmentProperties = [...commonFragmentProperties, 'collectionName', 'nrOfMembersAdded', 'parentId'];
const fragmentationFragmentIndices = ['_id_', 'root', 'viewName', 'immutable', 'parentId', 'collectionName'];
const fragmentationAllocationProperties = [...commonMongoProperties, 'viewName'];

const retentionMemberProperties = [...commonMongoProperties, 'collectionName', 'timestamp', 'versionOf', 'views']
const retentionMemberIndices = ['_id_', 'collectionName', 'timestamp', 'versionOf', 'views']

const ingestLdesMemberProperties = [...commonMongoProperties, 'collectionName', 'sequenceNr', 'model'];


const fragmentationFragmentCollectionUrl = 'http://localhost:9019/iow_devices/fragmentation_fragment';
const fragmentationAllocationCollectionUrl = 'http://localhost:9019/iow_devices/fragmentation_allocation';
const retentionMemberPropertiesCollectionUrl = 'http://localhost:9019/iow_devices/retention_member_properties';
const memberCollectionUrl = 'http://localhost:9019/iow_devices/ingest_ldesmember';
const oldFragmentCollectionUrl = 'http://localhost:9019/iow_devices/ldesfragment';
const oldMemberCollectionUrl = 'http://localhost:9019/iow_devices/ldesmember';
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

function checkIndices(collectionUrl: string, expected: string[],) {
    cy.request(`${collectionUrl}?includeIndices=true`).then(response => {
        expect(response.body.indices).to.have.same.members(expected);
    });
}

Given('the old ldesfragment collection is structured as expected', () => {
    checkDatabaseStructure(oldFragmentCollectionUrl, [...commonFragmentProperties, 'members']);
})

Given('the old ldesmember collection is structured as expected', () => {
    checkDatabaseStructure(oldMemberCollectionUrl, [...commonMongoProperties, 'ldesMember']);
})

When('the LDES contains at least {int} members in the old database', (count: number) => {
    mongo.checkCount(testDatabase(), 'ldesmember', count, (x, y) => x >= y);
})

Given('the old LDES server is available', () => {
    return oldServer.waitAvailable(LdesServer.ApplicationStarted, 1);
})

Then('the fragmentation_fragment collection is upgraded as expected', () => {
    checkDatabaseStructure(fragmentationFragmentCollectionUrl, fragmentationFragmentProperties);
    checkIndices(fragmentationFragmentCollectionUrl, fragmentationFragmentIndices);
})

Then('the fragmentation_allocation collection is upgraded as expected', () => {
    checkDatabaseStructure(fragmentationAllocationCollectionUrl, fragmentationAllocationProperties);
    checkIndices(fragmentationAllocationCollectionUrl, ['_id_', 'viewName']);
})

Then('the ingest_ldesmember collection is upgraded as expected', () => {
    checkDatabaseStructure(memberCollectionUrl, ingestLdesMemberProperties);
    checkIndices(memberCollectionUrl, ['_id_', 'collectionName', 'sequenceNr']);
})

Then('the retention_member_properties collection is upgraded as expected', () => {
    checkDatabaseStructure(retentionMemberPropertiesCollectionUrl, retentionMemberProperties);
    checkIndices(retentionMemberPropertiesCollectionUrl, retentionMemberIndices);
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

Then('the migrated config matches the expected config {string}', (filePath: string) => {
    new EventStream(eventstreamsUrl).visit().then(page => {
        expect(page.success).to.be.true;
        cy.fixture(`${filePath}`).then((content: string | object) => page.expectContent(content));
    });
})

When('the old server is done processing', waitUntilMemberCountStable);

When('I bring the old server down', () => {
    stopAndRemoveService(oldServer.serviceName);
})

When('I start the new LDES Server', () => {
    createAndStartService(newServer.serviceName).then(() => newServer.waitAvailable());
})
