import { After, Given, When, Then, Before } from "@badeball/cypress-cucumber-preprocessor";
import { DockerCompose, DockerComposeOptions, EnvironmentSettings } from "..";
import {
    LdesWorkbenchNiFi, LdesServerSimulator, LdesClientSink,
    MongoRestApi, JsonDataGenerator, LdesServer, LdesWorkbenchLdio
} from "../services";
import { Gtfs2Ldes } from "../services/gtfs2ldes";

let testContext: any;

export const dockerCompose = new DockerCompose(Cypress.env('userEnvironment'));
export const workbenchNifi = new LdesWorkbenchNiFi('http://localhost:8000')
export const workbenchLdio = new LdesWorkbenchLdio();
export const sink = new LdesClientSink('http://localhost:9003');
export const simulator = new LdesServerSimulator('http://localhost:9011');
export const mongo = new MongoRestApi('http://localhost:9019');
export const jsonDataGenerator = new JsonDataGenerator();
export const server = new LdesServer('http://localhost:8080');
export const gtfs2ldes = new Gtfs2Ldes();

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

// Given stuff

Given('the members are stored in collection {string} in database {string}', (collection: string, database: string) => {
    testContext.database = database;
    testContext.collection = collection;
});


Given('the {string} test is setup', (testPartialPath: string) => {
    testContext.testPartialPath = testPartialPath;
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
    simulator.postAlias(`${testContext.testPartialPath}/create-alias.json`);
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
    simulator.postAlias(`${testContext.testPartialPath}/create-alias.json`);
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

Given('the LDES Server Simulator is available', () => {
    simulator.waitAvailable();
})

// When stuff

When('I start the NiFi workflow', () => {
    workbenchNifi.pushStart();
})

When('I start the LDIO workflow', () => {
    createAndStartService(workbenchLdio.serviceName).then(() => workbenchLdio.waitAvailable());
})

When('I upload the data files: {string} with a duration of {int} seconds', (dataSet: string, seconds: number) => {
    simulator.waitAvailable();
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testContext.testPartialPath}/data/${baseName}.jsonld`, seconds));
})

function createAndStartService(service: string, additionalEnvironmentSettings?: EnvironmentSettings) {
    return dockerCompose.create(service, additionalEnvironmentSettings)
        .then(() => dockerCompose.start(service, additionalEnvironmentSettings))
        .then(() => testContext.delayedServices.push(service));
}

When('I start the JSON Data Generator', () => {
    createAndStartService(jsonDataGenerator.serviceName, { JSON_DATA_GENERATOR_SILENT: false })
        .then(() => jsonDataGenerator.waitAvailable());
})

When('the LDES contains at least {int} members', (count: number) => {
    mongo.checkCount(testContext.database, testContext.collection, count, (x, y) => x >= y);
})

When('I start the GTFS2LDES service', () => {
    createAndStartService(gtfs2ldes.serviceName)
        .then(() => gtfs2ldes.waitAvailable());
})

// Then stuff

Then('the sink contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})

Then('the LDES contains {int} members', (count: number) => {
    mongo.checkCount(testContext.database, testContext.collection, count);
})

export function currentMemberCount() {
    return mongo.count(testContext.database, testContext.collection);
}

Then('the LDES should contain {int} members', (memberCount: number) => {
    currentMemberCount().then(count => expect(count).to.equal(memberCount));
})


