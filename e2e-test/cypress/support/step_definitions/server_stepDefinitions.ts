/// <reference types="cypress" />
import N3 = require('n3');

import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesServer, MongoRestApi } from "..";
import { dockerComposeEnvironment, simulator } from "./step_definitions";

const server = new LdesServer('http://localhost:8080');
const mongo = new MongoRestApi('http://localhost:9012');

let quads: N3.Store;
let firstFragmentUrl: string;
let middleFragmentUrl: string;
let lastFragmentUrl: string;

function setupGipodLdesServer() {
    dockerComposeEnvironment.SPRING_DATA_MONGODB_DATABASE = 'gipod';
    dockerComposeEnvironment.LDES_COLLECTIONNAME = 'mobility-hindrances';
    dockerComposeEnvironment.LDES_MEMBERTYPE = "https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder";
    dockerComposeEnvironment.LDES_SHAPE = "https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/shape";
}

Then('the LDES contains {int} members', (count: number) => {
    mongo.checkCount('gipod', 'ldesmember', count);
})

Given('the ingest-ldes test is setup', () => {
    setupGipodLdesServer();
    dockerComposeEnvironment.VIEWS_0_FRAGMENTATIONS_0_CONFIG_MEMBERLIMIT = 1500;
})

Given('the time-fragment-ldes test is setup', () => {
    setupGipodLdesServer();
    dockerComposeEnvironment.VIEWS_0_FRAGMENTATIONS_0_CONFIG_MEMBERLIMIT = 300;
})

Given('the paginate-ldes test is setup', () => {
    setupGipodLdesServer();
    dockerComposeEnvironment.VIEWS_0_FRAGMENTATIONS_0_CONFIG_MEMBERLIMIT = 300;
})

Given('I have seeded the simulator with an initial data set', () => {
    simulator.isAvailable();
    ['alfa', 'beta'].forEach(baseName => simulator.postFragment(`use-cases/gipod/3.synchronize-ldes/data/${baseName}.jsonld`));
    simulator.postFragment('use-cases/gipod/3.synchronize-ldes/data/gamma.jsonld', 10);
    simulator.postAlias('use-cases/gipod/3.synchronize-ldes/create-alias.json');
})

Given('I have uploaded the time-fragments data set', () => {
    simulator.isAvailable();
    ['alfa', 'beta', 'epsilon'].forEach(baseName => simulator.postFragment(`use-cases/gipod/4.time-fragment-ldes/data/scenario4/${baseName}.jsonld`));
    simulator.postAlias('use-cases/gipod/4.time-fragment-ldes/create-alias.json');
})

Given('I have uploaded the paginate-ldes data set', () => {
    simulator.isAvailable();
    ['alfa', 'beta', 'gamma'].forEach(baseName => simulator.postFragment(`use-cases/gipod/5.paginate-ldes/data/${baseName}.jsonld`));
    simulator.postAlias('use-cases/gipod/5.paginate-ldes/create-alias.json');
})

Then('the first fragment is immutable', () => {
    server.getFirstFragmentUrl().then(url => {
        firstFragmentUrl = url;
        return cy.request(url).then(response => {
            server.expectMutableFragment(response, true);
            return server.parseQuads(response);
        }).then(x => quads = x);
    });
})

Then('the first fragment only has a {string} to the middle fragment', (relationType: string) => {
    middleFragmentUrl = server.expectOneRelation(quads, server.treePrefix + relationType);
})

Then('the middle fragment is immutable', () => {
    cy.request(middleFragmentUrl).then(response => {
        server.expectMutableFragment(response, true);
        return server.parseQuads(response);
    }).then(x => quads = x);
})

Then('the middle fragment only has a {string} to the first and last fragments', (relationType: string) => {
    const urls = server.expectRelationCount(quads, server.treePrefix + relationType, 2);
    expect(urls).to.contain(firstFragmentUrl);
    lastFragmentUrl = urls.find(x => x !== firstFragmentUrl);
    expect(lastFragmentUrl).not.to.be.undefined;
})

Then('the middle fragment only has a {string} to the first fragment', (relationType: string) => {
    const url = server.expectOneRelation(quads, server.treePrefix + relationType);
    expect(url).to.equal(firstFragmentUrl);
})

Then('the middle fragment only has a {string} to the last fragment', (relationType: string) => {
    lastFragmentUrl = server.expectOneRelation(quads, server.treePrefix + relationType);
})

Then('the last fragment is not immutable', () => {
    cy.request(lastFragmentUrl).then(response => {
        server.expectMutableFragment(response, false);
        return server.parseQuads(response);
    }).then(x => quads = x);
})

Then('the last fragment only has a {string} to the middle fragment', (relationType: string) => {
    const url = server.expectOneRelation(quads, server.treePrefix + relationType);
    expect(url).to.equals(middleFragmentUrl);
})

  