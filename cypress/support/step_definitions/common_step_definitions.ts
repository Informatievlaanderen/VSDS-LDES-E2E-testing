import { After, Before, Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { checkSuccess, DockerCompose, DockerComposeOptions, EnvironmentSettings, timeouts } from "..";
import { LdesServer, LdesServerSimulator, LdesWorkbenchLdio, TestMessageGenerator, TestMessageSink } from "../services";
import { Fragment } from "../ldes";
import { LdiLdesDiscoverer } from "../services/ldi-ldes-discoverer";
import { PostgresRestApi } from "../services/postgres-rest-api";

let testContext: any;

export const dockerCompose = new DockerCompose(Cypress.env('userEnvironment'));

export function testPartialPath() {
    return testContext && testContext.testPartialPath;
}

export function setAdditionalEnvironmentSetting(property: string, value: string) {
    testContext.environment[property] = value;
}

Before(() => {
    // log and cleanup if previous test failed (After is not run in this case!)
    dockerCompose.cleanup().then(() => {
        dockerCompose.initialize();
        testContext = {
            testPartialPath: '',
            environment: {},
            database: '',
            collection: '',
        }
    })
});

After(() => {
    dockerCompose.cleanup();
});

export const simulator = new LdesServerSimulator('http://localhost:9011');
export const workbench = new LdesWorkbenchLdio('http://localhost:8081');
export const sink = new TestMessageSink('http://localhost:9003');

function run(script: string) {
    const cmd = `cd ${testContext.testPartialPath} && chmod +x ./${script} && sh ./${script}`;
    return cy.log(cmd).exec(cmd, { timeout: timeouts.verySlowAction, env: testContext.environment })
        .then(result => expect(result.code).to.eql(0));
}

function startService(serviceName: string) {
    const cmd = `cd ${testContext.testPartialPath} && docker compose up ${serviceName} -d --wait`;
    return cy.log(cmd).exec(cmd, { timeout: timeouts.slowAction, env: testContext.environment })
        .then(result => expect(result.code).to.eql(0));
}

Given('I have setup context {string}', (testPartialPath: string) => {
    if (!testContext.testPartialPath) testContext.testPartialPath = testPartialPath;
    return run('setup.sh');
})

Given('I have seeded and aliased the {string} simulator data set', (dataSet: string) => {
    simulator.seed(Cypress.env(dataSet));
    return simulator.postAlias(`${testContext.testPartialPath}/simulator/create-alias.json`);
})

When('I upload the LDIO {string}', (pipeline: string) => {
    return workbench.upload(`${testContext.testPartialPath}/workbench/${pipeline}.yml`);
})

Then('the sink contains {int} members in collection {string}', (count: number, collectionName: string) => {
    sink.checkCount(collectionName, count);
})

Then('I tear down the context', () => {
    return run('teardown.sh');
})

When('I start the {string} service', (serviceName: string) => {
    return startService(serviceName);
})


// TODO: check below this line

const membersTable = 'members';
const pagesTable = 'pages'

export const postgres = new PostgresRestApi('http://localhost:9018');
export const jsonDataGenerator = new TestMessageGenerator();
export const server = new LdesServer('http://localhost:8080');
export const protectedServer = new LdesServer('http://localhost:8082');
export const ldesDiscoverer = new LdiLdesDiscoverer();

export const byPage = 'by-page';


export function ensureRelationCount(fragment: Fragment, amount: number) {
    return waitForFragment(fragment, x => x.relations.length >= amount, `have at least ${amount} relations`);
}

export function setTargetUrl(targeturl: string) {
    const command = `echo ${targeturl} > ${testContext.testPartialPath}/data/TARGETURL`;
    return cy.log(command)
        .exec(command, { log: true, failOnNonZeroExit: false })
        .then(result => checkSuccess(result).then(success => expect(success).to.be.true))
}

export function range(start: number, end: number) {
    return new Array(end - start + 1).fill(start).map((_, i) => i + 1);
}

export function obtainViewWithDefaultFragment(ldes: string, view: string) {
    return server.getLdes(ldes)
        .then(ldes => new Fragment(ldes.viewUrl(view).replace("ldes-server", "localhost")))
        .then(view => waitForFragment(view, x => x.relations.filter(relation => relation.type == "https://w3id.org/tree#Relation").length >= 1, 'have 1 default relation'));
}

export function obtainRootFragment(ldes: string, view: string) {
    return server.getLdes(ldes)
        .then(ldes => new Fragment(ldes.viewUrl(view)))
        .then(view => waitForFragment(view, x => x.hasSingleRelationLink, 'have a single relation').then(() => new Fragment(view.relation.link)));
}

export function waitForFragment(fragment: Fragment, condition: (x: Fragment) => boolean, message: string) {
    return cy.waitUntil(() =>
        fragment.visit().then(fragment => condition(fragment)),
        {
            timeout: timeouts.slowAction,
            interval: timeouts.check,
            errorMsg: `Timed out waiting for ${fragment.url} to ${message}.`
        }).then(() => fragment);
}

export function clientConnectorFailsOnStatusCode(code: number) {
    workbench.waitForDockerLog(code.toString())
}

// Given stuff

Given('we use context {string}', (composeFilePath: string) => {
    if (!testContext.testPartialPath) testContext.testPartialPath = composeFilePath;
})

Given('the previously defined context is started', () => {
    if (!testContext.testPartialPath)
        throw new Error("No context defined previously");

    const options: DockerComposeOptions = {
        dockerComposeFile: `${testContext.testPartialPath}/docker-compose.yml`,
        environmentFile: `${testContext.testPartialPath}/.env`,
        environment: testContext.environment
    };
    dockerCompose.up(options);
})

Given('context {string} is started', (composeFilePath: string) => {
    if (!testContext.testPartialPath) testContext.testPartialPath = composeFilePath;

    const options: DockerComposeOptions = {
        dockerComposeFile: `${composeFilePath}/docker-compose.yml`,
        environmentFile: `${testContext.testPartialPath}/.env`,
        environment: testContext.environment
    };
    dockerCompose.up(options);
})

Given('I have aliased the {string} simulator data set', (dataSet: string) => {
    simulator.waitAvailable();
    simulator.seed(Cypress.env(dataSet));
    simulator.postAlias(`${testContext.testPartialPath}/data/create-alias.json`);
})

Given('I have aliased the data set', () => {
    simulator.waitAvailable();
    simulator.postAlias(`${testContext.testPartialPath}/data/create-alias.json`);
})


export function createAndStartService(service: string, environment?: EnvironmentSettings) {
    return dockerCompose.create(service, environment)
        .then(() => dockerCompose.start(service, testPartialPath(), environment));
}

When('I start the JSON Data Generator', () => {
    createAndStartService(jsonDataGenerator.serviceName).then(() => jsonDataGenerator.waitAvailable());
})

Given('the LDES server is available', () => {
    return server.waitAvailable();
})

Given('the LDES server is available and configured', () => {
    return server.waitAvailable().then(server => server.sendConfiguration(testContext.testPartialPath));
})

Given('the protected LDES server is available', () => {
    return protectedServer.waitAvailable();
})

Given('the protected LDES server is available and configured', () => {
    return protectedServer.waitAvailable().then(server => server.sendConfiguration(testContext.testPartialPath));
})

Given('the LDES Server Simulator is available', () => {
    return simulator.waitAvailable();
})

Given('the LDIO workbench is available', () => {
    return workbench.waitAvailable();
})

// When stuff

When('I start the LDES Client LDIO workbench', () => {
    return createAndStartService(workbench.serviceName).then(() => workbench.waitAvailable());
})

When('I start the LDIO workbench', () => {
    return createAndStartService(workbench.serviceName)
        .then(() => workbench.waitAvailable())
        .then(() => workbench.waitForPipelinesRunning());
})

When('I pause the {string} pipeline on the LDIO workbench', (pipeline: string) => {
    workbench.pause(pipeline);
})

When('I resume the {string} pipeline on the LDIO workbench', (pipeline: string) => {
    workbench.resume(pipeline);
})

When('I start the LDES Discoverer', () => {
    createAndStartService(ldesDiscoverer.serviceName);
})


export function stopAndRemoveService(service: string) {
    return dockerCompose.stopContainerAndRemoveVolumesAndImage(service);
}

When('the LDES contains {int} members', (count: number) => {
    postgres.checkCount(membersTable, count);
})

When('the LDES contains {int} fragments', (count: number) => {
    postgres.checkCount(pagesTable, count);
})

When('the LDES contains at least {int} members', (count: number) => {
    postgres.checkCount(membersTable, count, (x, y) => x >= y);
})

When('the LDES fragment {string} contains at least {int} members', (fragmentId: string, count: number) => {
    postgres.checkFragmentMemberCount(fragmentId, count, (x, y) => x >= y);
})

When('the LDES contains at least {int} fragments', (count: number) => {
    postgres.checkCount(pagesTable, count, (x, y) => x >= y);
})

export function waitUntilMemberCountStable() {
    let previousCount: number;
    currentMemberCount().then(count => previousCount = count).then(count => cy.log(`Previous count: ${count}`));
    return cy.waitUntil(() =>
        currentMemberCount().then(count => cy.log(`Current count: ${count}`).then(() => count === previousCount ? true : (previousCount = count, false))),
        {
            timeout: timeouts.fastAction,
            interval: timeouts.check,
            errorMsg: `Timed out waiting for ingest count to retain the same (last: ${previousCount})`
        }
    );
}

let lastMemberCount: number;
When('I remember the last fragment member count for view {string}', (view: string) => {
    obtainRootFragment('devices', view)
        .then(fragment => waitForFragment(fragment, x => x.memberCount > 0, 'have members'))
        .then(fragment => cy.log(`Member count: ${fragment.memberCount}`).then(() => lastMemberCount = fragment.memberCount));
})

// Then stuff

Then('the fragment member count increases for view {string}', (view: string) => {
    obtainRootFragment('devices', view)
        .then(fragment => waitForFragment(fragment, x => x.memberCount > lastMemberCount, 'increase member count'))
        .then(fragment => cy.log(`New member count: ${fragment.memberCount}`));
})

Then('the {string} sink contains at least {int} members', (collectionName: string, count: number) => {
    sink.checkCount(collectionName, count, (x, y) => x >= y);
})

export function currentMemberCount() {
    return postgres.count(membersTable);
}

Then('the LDES should contain {int} members', (memberCount: number) => {
    currentMemberCount().then(count => expect(count).to.equal(memberCount));
})

Then('the LDES member count increases', () => {
    currentMemberCount().then(currentCount =>
        postgres.checkCount(membersTable, currentCount,
            (actual, expected) => actual > expected));
})

Then("the LDES structure contains {int} relations", (relationCount: number) =>
    ldesDiscoverer.checkRelationCount(relationCount)
)

Then("the LDES structure is equal to {string}", (expectedOutputFileName: string) => {
    ldesDiscoverer.checkOutputStructure(`${testContext.testPartialPath}/data/${expectedOutputFileName}`)
})

Then('the previously defined context is stopped', () => {
    dockerCompose.cleanup();
})
