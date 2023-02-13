import { After, Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { DockerCompose, LdesWorkbenchNiFi, credentials, LdesServerSimulator, LdesClientSink, MongoRestApi } from "..";

const testContext = { testPartialPath: '' };

const dockerCompose = new DockerCompose();
const workbench = new LdesWorkbenchNiFi('https://localhost:8443')
const sink = new LdesClientSink('http://localhost:9003');
const simulator = new LdesServerSimulator('http://localhost:9011');
const mongo = new MongoRestApi('http://localhost:9019');

After(() => {
    dockerCompose.down();
});

// Given stuff

Given('the {string} test is setup', (testPartialPath: string) => {
    testContext.testPartialPath = testPartialPath;
});

Given('context {string} is started', (composeFilePath: string) => {
    dockerCompose.up(`${composeFilePath}/docker-compose.yml`, `${testContext.testPartialPath}/.env`)
        .then(() => cy.waitUntil(() => workbench.isReady(), { timeout: 600000, interval: 5000 }))
        .then(() => simulator.isAvailable());
})

Given('I have logged on to the Apache NiFi UI', () => {
    workbench.logon(credentials);
});

Given('I have uploaded the workflow', () => {
    workbench.uploadWorkflow(`${testContext.testPartialPath}/nifi-workflow.json`);
})

Given('I have aliased the pre-seeded simulator data set', () => {
    simulator.isAvailable();
    simulator.seed(Cypress.env('gipodDataSet'));
    simulator.postAlias(`${testContext.testPartialPath}/create-alias.json`);
})

Given('I have uploaded the data files: {string}', (dataSet: string) => {
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`));
})

Given('I have uploaded the data files: {string} with a duration of {int} seconds', (dataSet: string, seconds: number) => {
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`, seconds));
})

Given('I have aliased the data set', () => {
    simulator.postAlias(`${testContext.testPartialPath}/create-alias.json`);
})

// When stuff

When('I start the workflow', () => {
    workbench.pushStart();
})

When('I upload the data files: {string} with a duration of {int} seconds', (dataSet: string, seconds: number) => {
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`, seconds));
})

// Then stuff

Then('the sink contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})

Then('the LDES contains {int} members', (count: number) => {
    mongo.checkCount('gipod', 'ldesmember', count);
})
