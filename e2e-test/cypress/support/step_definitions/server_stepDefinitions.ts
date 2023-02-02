import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesServer } from "../ldes-server";
import { MongoRestApi } from "../mongo-rest-api";
import { dockerComposeEnvironment } from "./step_definitions";

const server = new LdesServer('http://localhost:8080');
const mongo = new MongoRestApi('http://localhost:9012');

let middleFragment: string;
let lastFragment: string;

function setupGipodLdesServer() {
    dockerComposeEnvironment.SPRING_DATA_MONGODB_DATABASE = 'gipod';
    dockerComposeEnvironment.LDES_COLLECTIONNAME = 'mobility-hindrances';
    dockerComposeEnvironment.LDES_MEMBERTYPE = "https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder";
    dockerComposeEnvironment.LDES_SHAPE = "https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/shape";
}

Then('the MongoDB contains {int} members', (count: number) => {
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

Then('the first fragment is immutable and links to the middle fragment', () => {
    return server.getFirstFragmentUrl()
        .then(url => server.checkFirstFragmentAndGetMiddleFragmentUrl(url))
        .then(url => middleFragment = url);
})

Then('the middle fragment is immutable and links to the first and the last fragment', () => {
    return server.checkMiddleFragmentAndGetLastFragmentUrl(middleFragment)
        .then(url => lastFragment = url);
})

Then('the last fragment is not immutable and links to the middle fragment', () => {
    return server.checkLastFragment(lastFragment);
})