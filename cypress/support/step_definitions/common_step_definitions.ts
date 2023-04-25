import { After, Given, When, Then, Before } from "@badeball/cypress-cucumber-preprocessor";
import { DockerCompose, DockerComposeOptions, EnvironmentSettings, FragmentResponse } from "..";
import {
    LdesWorkbenchNiFi, LdesServerSimulator, TestMessageSink,
    MongoRestApi, TestMessageGenerator, LdesServer, LdesWorkbenchLdio
} from "../services";
import { Gtfs2Ldes } from "../services/gtfs2ldes";
import { Fragment } from "../ldes";

let testContext: any;
const ldesMemberCollection = 'ldesmember';

export const dockerCompose = new DockerCompose(Cypress.env('userEnvironment'));
export const workbenchNifi = new LdesWorkbenchNiFi('http://localhost:8000')
export const workbenchLdio = new LdesWorkbenchLdio('http://localhost:8081');
export const sink = new TestMessageSink('http://localhost:9003');
export const simulator = new LdesServerSimulator('http://localhost:9011');
export const mongo = new MongoRestApi('http://localhost:9019');
export const jsonDataGenerator = new TestMessageGenerator();
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

export function ensureRelationCount(fragment: Fragment, amount: number) {
    return cy.waitUntil(() => fragment.visit().then(x => x.relations.length >= amount));
}

export function setTargetUrl(targeturl: string) {
    const command = `echo ${targeturl} > ${testContext.testPartialPath}/data/TARGETURL`;
    return cy.log(command).exec(command, { log: true })
}

// Given stuff

Given('the members are stored in database {string}', (database: string) => {
    testContext.database = database;
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

Given('the LDES Server Simulator is available', () => {
    simulator.waitAvailable();
})

Given('I started the workflow', () => {
    workbenchNifi.pushStart();
})

Given('the {string} workbench is available', (workbench) => {
    switch (workbench) {
        case 'NIFI': {
            workbenchNifi.waitAvailable();
            workbenchNifi.uploadWorkflow(`${testPartialPath()}/nifi-workflow.json`);
            workbenchNifi.pushStart();
            break;
        }
        case 'LDIO': {
            workbenchLdio.waitAvailable();
            break;
        }
        case 'NIFI & LDIO': {
            workbenchNifi.waitAvailable();
            workbenchNifi.uploadWorkflow(`${testPartialPath()}/nifi-workflow.json`);
            workbenchNifi.pushStart();
            workbenchLdio.waitAvailable();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

// When stuff

When('I start the {string} workflow', (workbench) => {
    switch (workbench) {
        case 'NIFI': {
            createAndStartService(workbenchNifi.serviceName).then(() => workbenchNifi.waitAvailable());
            workbenchNifi.uploadWorkflow(`${testContext.testPartialPath}/nifi-workflow.json`);
            workbenchNifi.pushStart();
            break;
        }
        case 'LDIO': {
            createAndStartService(workbenchLdio.serviceName).then(() => workbenchLdio.waitAvailable());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
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
    mongo.checkCount(testContext.database, ldesMemberCollection, count);
})

When('the LDES contains {int} fragments', (count: number) => {
    mongo.checkCount(testContext.database, 'ldesfragment', count);
})

When('the LDES contains at least {int} members', (count: number) => {
    mongo.checkCount(testContext.database, ldesMemberCollection, count, (x, y) => x >= y);
})

When('the LDES contains at least {int} fragments', (count: number) => {
    mongo.checkCount(testContext.database, 'ldesfragment', count, (x, y) => x >= y);
})

export function waitUntilMemberCountStable() {
    let previousCount: number;
    currentMemberCount().then(count => previousCount = count).then(count => cy.log(`Previous count: ${count}`));
    cy.waitUntil(() =>
        currentMemberCount().then(count =>
            cy.log(`Current count: ${count}`).then(() => count === previousCount ? true : (previousCount = count, false))),
        { timeout: 5000, interval: 1000 }
    );
}

When('I start the GTFS2LDES service', () => {
    createAndStartService(gtfs2ldes.serviceName).then(() => gtfs2ldes.waitAvailable());
})

When('the GTFS to LDES service starts sending linked connections', () => {
    gtfs2ldes.isSendingLinkedConnections();
})

let lastMemberCount: number;
When('I remember the last fragment member count', () => {
    server.getLdes('devices')
        .then(ldes => new Fragment(ldes.viewUrl()).visit().then(view => new Fragment(view.relation.link).visit())
        .then(fragment => fragment.getLatestFragment('GreaterThanOrEqualToRelation'))
        .then(fragment => cy.log(`Member count: ${fragment.memberCount}`).then(() => lastMemberCount = fragment.memberCount)));
})

// Then stuff

Then('the last fragment member count increases', () => {
    cy.waitUntil(() => server.getLdes('devices')
        .then(ldes => new Fragment(ldes.viewUrl()).visit().then(view => new Fragment(view.relation.link).visit()))
        .then(fragment =>cy.log(`New member count: ${fragment.memberCount}`).then(() => lastMemberCount < fragment.memberCount)),
        { timeout: 5000, interval: 1000 }
    );
})

Then('the sink contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})

Then('the {string} sink contains at least {int} members', (collectionName: string, count: number) => {
    sink.checkCount(collectionName, count, (x, y) => x >= y);
})

export function currentMemberCount() {
    return mongo.count(testContext.database, ldesMemberCollection);
}

Then('the LDES should contain {int} members', (memberCount: number) => {
    currentMemberCount().then(count => expect(count).to.equal(memberCount));
})

Then('the LDES member count increases', () => {
    currentMemberCount().then(currentCount =>
        mongo.checkCount(testContext.database, ldesMemberCollection, currentCount,
            (actual, expected) => actual > expected));
})

Then('all but the first fragment have been requested once', () => {
    
})
