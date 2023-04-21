import { After, Given, When, Then, Before } from "@badeball/cypress-cucumber-preprocessor";
import { DockerCompose, DockerComposeOptions, EnvironmentSettings } from "..";
import {
    LdesWorkbenchNiFi, LdesServerSimulator, TestMessageSink,
    MongoRestApi, TestMessageGenerator, LdesServer, LdesWorkbenchLdio
} from "../services";
import { Gtfs2Ldes } from "../services/gtfs2ldes";
import { ClientCli } from "../services/client-cli";
import { Fragment } from "../ldes";

let testContext: any;
let memberCount;

export const dockerCompose = new DockerCompose(Cypress.env('userEnvironment'));
export const workbenchNifi = new LdesWorkbenchNiFi('http://localhost:8000')
export const workbenchLdio = new LdesWorkbenchLdio('http://localhost:8081');
export const sink = new TestMessageSink('http://localhost:9003');
export const simulator = new LdesServerSimulator('http://localhost:9011');
export const mongo = new MongoRestApi('http://localhost:9019');
export const jsonDataGenerator = new TestMessageGenerator();
export const server = new LdesServer('http://localhost:8080');
export const gtfs2ldes = new Gtfs2Ldes();
export const clientCli = new ClientCli('http://localhost:8081');
export const newWorkbenchLdio = new LdesWorkbenchLdio('http://localhost:8081', 'new-ldio');
export const workbench = new LdesWorkbenchLdio('http://localhost:8082');

Before(() => {
    testContext?.delayedServices.forEach((x: string) => dockerCompose.stop(x));
    dockerCompose.down(testContext?.delayedServices?.length ? 'delay-started' : '');
    if (testContext?.delayedServices) testContext.delayedServices = [];

    dockerCompose.initialize();
    testContext = {
        testPartialPath: '',
        additionalEnvironmentSetting: {},
        database: '',
        collection: '',
        delayedServices: [],
    }
});

After(() => {
    testContext.delayedServices.forEach((x: string) => dockerCompose.stop(x));
    dockerCompose.down(testContext.delayedServices.length ? 'delay-started' : '');
});

export function testPartialPath() {
    return testContext && testContext.testPartialPath;
}

export function ensureRelationCount(fragment: Fragment, amount: number) {
    return cy.waitUntil(() => fragment.visit().then(x => x.relations.length >= amount));
}

// Given stuff

Given('the members are stored in collection {string} in database {string}', (collection: string, database: string) => {
    testContext.database = database;
    testContext.collection = collection;
});

Given('context {string} is started', (composeFilePath: string) => {
    if (!testContext.testPartialPath) testContext.testPartialPath = composeFilePath;

    const options: DockerComposeOptions = {
        dockerComposeFile: `${composeFilePath}/docker-compose.yml`,
        environmentFile: `${testContext.testPartialPath}/.env`,
        additionalEnvironmentSetting: testContext.additionalEnvironmentSetting
    };
    dockerCompose.up(options);
})

Given('the NiFi workbench is available', () => {
    workbenchNifi.waitAvailable();
    workbenchNifi.load();
});

Given('I have uploaded the workflow', () => {
    workbenchNifi.uploadWorkflow(`${testContext.testPartialPath}/nifi-workflow.json`);
})

Given('I have aliased the pre-seeded simulator data set', () => {
    simulator.waitAvailable();
    simulator.seed(Cypress.env('gipodDataSet'));
    simulator.postAlias(`${testContext.testPartialPath}/data/create-alias.json`);
})

Given('I have uploaded the data files: {string}', (dataSet: string) => {
    simulator.waitAvailable();
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`));
})

Given('I have uploaded the data files: {string} with a duration of {int} seconds', (dataSet: string, seconds: number) => {
    simulator.waitAvailable();
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`, seconds));
})

Given('I have aliased the data set', () => {
    simulator.waitAvailable();
    simulator.postAlias(`${testContext.testPartialPath}/data/create-alias.json`);
})

export function setAdditionalEnvironmentSetting(property: string, value: string) {
    testContext.additionalEnvironmentSetting[property] = value;
}

Given('I have configured the {string} as {string}', (property: string, value: string) => {
    setAdditionalEnvironmentSetting(property, value);
})

Given('the LDES server is available', () => {
    return server.waitAvailable();
})

Given('the old LDES server is available', () => {
    return server.waitAvailable(LdesServer.ApplicationStarted);
})

Given('the LDES Server Simulator is available', () => {
    simulator.waitAvailable();
})

Given('the LDIO workflow is available', () => {
    workbenchLdio.waitAvailable();
})

Given('I start the new LDIO workflow', () => {
    //wanneer containerId wordt opgehaald in waitAvailable = ldio-workflow, daarom lijn 127 toegevoegd
    createAndStartService('new-ldio')
        .then(() => newWorkbenchLdio.waitAvailable());
})

// When stuff

When('I launch the Client CLI', () => {
    createAndStartService(clientCli.serviceName).then(() => clientCli.waitAvailable());
})

When('I start the NiFi workflow', () => {
    workbenchNifi.pushStart();
})

When('I start the LDIO workflow', () => {
    createAndStartService(workbenchLdio.serviceName).then(() => workbenchLdio.waitAvailable());
})

When('I pause the LDIO workflow output', () => {
    workbenchLdio.pause();

})

When('I pause the new LDIO workflow output', () => {
    workbench.pause();
})

When('I resume the LDIO workflow output', () => {
    workbenchLdio.resume();
})

When('I resume the new LDIO workflow output', () => {
    workbench.resume();
})

When('I upload the data files: {string} with a duration of {int} seconds', (dataSet: string, seconds: number) => {
    simulator.waitAvailable();
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`, seconds));
})

export function createAndStartService(service: string, additionalEnvironmentSettings?: EnvironmentSettings) {
    return dockerCompose.create(service, additionalEnvironmentSettings)
        .then(() => dockerCompose.start(service, additionalEnvironmentSettings))
        .then(() => testContext.delayedServices.push(service));
}

When('I start the JSON Data Generator', () => {
    createAndStartService(jsonDataGenerator.serviceName, { JSON_DATA_GENERATOR_SILENT: false })
        .then(() => jsonDataGenerator.waitAvailable());
})

When('the LDES contains {int} members', (count: number) => {
    mongo.checkCount(testContext.database, testContext.collection, count);
})

When('the LDES contains {int} fragments', (count: number) => {
    mongo.checkCount(testContext.database, 'ldesfragment', count);
})

When('the LDES contains at least {int} members', (count: number) => {
    mongo.checkCount(testContext.database, testContext.collection, count, (x, y) => x >= y);
    currentMemberCount().then(count => memberCount = count);
})

When('the old server is done processing', () => {
    let previousCount;
    currentMemberCount().then(count => previousCount = count).then(count => cy.log(`Previous count: ${count}`));
    cy.waitUntil(() =>
        currentMemberCount().then(count =>
            cy.log(`Current count: ${count}`).then(() => count === previousCount ? true : (previousCount = count, false))),
        { timeout: 5000, interval: 1000 }
    );
})

When('I start the GTFS2LDES service', () => {
    createAndStartService(gtfs2ldes.serviceName)
        .then(() => gtfs2ldes.waitAvailable());
})

When('I bring the old server down', () => {
    dockerCompose.stop('old-ldes-server');
    dockerCompose.removeVolumesAndImage('old-ldes-server');
})

When('I start the new LDES Server', () => {
    createAndStartService('new-ldes-server')
        .then(() => server.waitAvailable());
})

When('I update the targeturl of the old LDI', () => {
    const command = `echo http://old-ldio:8080/pipeline > ./data/TARGETURL`;
    return cy.log(command).exec(command, { log: true })
})

When('I update the targeturl of the new LDI', () => {
    const command = `echo http://new-ldio:8080/pipeline > ./data/TARGETURL`;
    return cy.log(command).exec(command, { log: true })
})

When('I bring the old LDIO workbench down', () => {
    dockerCompose.stop('old-ldio');
    dockerCompose.removeVolumesAndImage('old-ldio');
})

// Then stuff

Then('the sink contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})

export function currentMemberCount() {
    return mongo.count(testContext.database, testContext.collection);
}

Then('the LDES should contain {int} members', (memberCount: number) => {
    currentMemberCount().then(count => expect(count).to.equal(memberCount));
})

Then('the Client CLI contains {int} members', (count: number) => {
    clientCli.checkCount(count);
})

Then('the LDES member count increases', () => {
    currentMemberCount().then(newMemberCount => expect(newMemberCount).to.be.greaterThan(memberCount));
})
