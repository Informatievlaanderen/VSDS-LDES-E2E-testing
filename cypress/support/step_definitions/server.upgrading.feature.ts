import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, dockerCompose, waitUntilMemberCountStable, workbenchLdio, workbenchNifi } from "./common_step_definitions";
import { LdesServer } from "../services";

const oldServer = new LdesServer('http://localhost:8080', 'old-ldes-server');
const newServer = new LdesServer('http://localhost:8080', 'new-ldes-server');

const commonFragmentProperties = ['_class', 'fragmentPairs', 'immutable', 'relations', 'root', 'viewName'];
const commonMemberProperties = ['_class'];
const fragmentCollectionUrl = 'http://localhost:9019/iow_devices/ldesfragment';
const memberCollectionUrl = 'http://localhost:9019/iow_devices/ldesmember';

function checkDatabaseStructure(collectionUrl: string, expected: string[],) {
    cy.exec(`curl -s "${collectionUrl}?includeDocuments=true" | jq "[.documents[] | keys] | flatten | unique | map(select(. != \\"_id\\"))"`, { failOnNonZeroExit: false })
        .then(result => {
            const actual = JSON.parse(result.stdout) as string[];
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
    return oldServer.waitAvailable(LdesServer.ApplicationStarted);
})

Then('the ldesfragment collection is upgraded as expected', () => {
    checkDatabaseStructure(fragmentCollectionUrl, 
        [...commonFragmentProperties, 'collectionName', 'immutableTimestamp', 'numberOfMembers', 'parentId', 'softDeleted']);
})

Then('the ldesmember collection is upgraded as expected', () => {
    checkDatabaseStructure(memberCollectionUrl, 
        [...commonMemberProperties, 'collectionName', 'model', 'sequenceNr', 'timestamp', 'treeNodeReferences', 'versionOf']);
})

When('I pause the {string} workbench output', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            workbenchNifi.openWorkflow();
            workbenchNifi.selectProcessor('InvokeHTTP');
            workbenchNifi.pushStop();
            break;
        }
        case 'LDIO': {
            workbenchLdio.pause();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I resume the {string} workbench output', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            workbenchNifi.openWorkflow();
            workbenchNifi.selectProcessor('InvokeHTTP');
            workbenchNifi.pushStart();
            break;
        }
        case 'LDIO': {
            workbenchLdio.resume();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('the old server is done processing', waitUntilMemberCountStable);

When('I bring the old server down', () => {
    dockerCompose.stopContainerAndRemoveVolumesAndImage(oldServer.serviceName);
})

When('I start the new LDES Server', () => {
    createAndStartService(newServer.serviceName).then(() => newServer.waitAvailable());
})
