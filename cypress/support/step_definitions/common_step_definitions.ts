import {After, Before, Given, Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {checkSuccess, DockerCompose, DockerComposeOptions, EnvironmentSettings, timeouts} from "..";
import {
    LdesServer,
    LdesServerSimulator,
    LdesWorkbenchLdio,
    LdesWorkbenchNiFi,
    MongoRestApi,
    TestMessageGenerator,
    TestMessageSink,
} from "../services";
import {Gtfs2Ldes} from "../services/gtfs2ldes";
import {Fragment} from "../ldes";
import {LdesClientWorkbench} from "../services/ldes-client-workbench";
import {LdiLdesDiscoverer} from "../services/ldi-ldes-discoverer";
import {PostgresRestApi} from "../services/postgres-rest-api";

let testContext: any;
const ldesMemberCollection = 'ingest_ldesmember';
const ldesFragmentCollection = 'fragmentation_fragment'

export const dockerCompose = new DockerCompose(Cypress.env('userEnvironment'));
export const workbenchNifi = new LdesWorkbenchNiFi('http://localhost:8000')
export const workbenchLdio = new LdesWorkbenchLdio('http://localhost:8081');
export const clientWorkbench = new LdesClientWorkbench('http://localhost:8081');
export const sink = new TestMessageSink('http://localhost:9003');
export const simulator = new LdesServerSimulator('http://localhost:9011');
export const postgres = new PostgresRestApi('http://localhost:9018');
export const jsonDataGenerator = new TestMessageGenerator();
export const server = new LdesServer('http://localhost:8080');
export const gtfs2ldes = new Gtfs2Ldes();
export const ldesDiscoverer = new LdiLdesDiscoverer();

export const byPage = 'by-page';

Before(() => {
    // log and cleanup if previous test failed (After is not run in this case!)
    // dockerCompose.logRunningContainers().then(() => 
    dockerCompose.cleanup().then(() => {
        dockerCompose.initialize();
        testContext = {
            testPartialPath: '',
            additionalEnvironmentSettings: {},
            database: '',
            collection: '',
        }
    })
    //);
});

After(() => {
    dockerCompose.cleanup();
});

export function testPartialPath() {
    return testContext && testContext.testPartialPath;
}

export function ensureRelationCount(fragment: Fragment, amount: number) {
    return waitForFragment(fragment, x => x.relations.length >= amount, `have at least ${amount} relations`);
}

export function setTargetUrl(targeturl: string) {
    const command = `echo ${targeturl} > ${testContext.testPartialPath}/data/TARGETURL`;
    return cy.log(command)
        .exec(command, {log: true, failOnNonZeroExit: false})
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
    workbenchLdio.waitForDockerLog(code.toString())
}

// Given stuff

Given('the members are stored in database {string}', (database: string) => {
    testContext.database = database;
});

Given('environment variable {string} is defined as the hostname', (variable: string) => {
    cy.exec('echo ldes-server').then(result => {
        setAdditionalEnvironmentSetting(variable, result.stdout);
    })
})

Given('context {string} is started', (composeFilePath: string) => {
    if (!testContext.testPartialPath) testContext.testPartialPath = composeFilePath;

    const options: DockerComposeOptions = {
        dockerComposeFile: `${composeFilePath}/docker-compose.yml`,
        environmentFile: `${testContext.testPartialPath}/.env`,
        additionalEnvironmentSettings: testContext.additionalEnvironmentSettings
    };
    dockerCompose.up(options);
})

Given('the NiFi workbench is available', () => {
    workbenchNifi.waitAvailable();
});

Given('I have uploaded the workflow', () => {
    workbenchNifi.uploadWorkflow(`${testContext.testPartialPath}/nifi-workflow.json`);
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

export function setAdditionalEnvironmentSetting(property: string, value: string) {
    testContext.additionalEnvironmentSettings[property] = value;
}

Given('the LDES server is available', () => {
    return server.waitAvailable();
})

Given('the LDES server is available and configured', () => {
    return server.waitAvailable().then(server => server.sendConfiguration(testContext.testPartialPath));
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
        default:
            throw new Error(`Unknown workbench '${workbench}'`);
    }
})

// When stuff

function startNifiWorkbench() {
    createAndStartService(workbenchNifi.serviceName).then(() => workbenchNifi.waitAvailable());
    workbenchNifi.uploadWorkflow(`${testContext.testPartialPath}/nifi-workflow.json`);
    workbenchNifi.pushStart();
}

When('I start the LDES Client {string} workbench', (workbench) => {
    switch (workbench) {
        case 'NIFI': {
            startNifiWorkbench();
            break;
        }
        case 'LDIO': {
            createAndStartService(clientWorkbench.serviceName).then(() => clientWorkbench.waitAvailable());
            break;
        }
        default:
            throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I start the {string} workbench', (workbench) => {
    switch (workbench) {
        case 'NIFI': {
            startNifiWorkbench();
            break;
        }
        case 'LDIO': {
            createAndStartService(workbenchLdio.serviceName).then(() => workbenchLdio.waitAvailable());
            break;
        }
        default:
            throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I pause the {string} pipeline on the {string} workbench', (pipeline: string, workbench: string) => {
    switch (workbench) {
        case 'NIFI': {
            workbenchNifi.openWorkflow();
            workbenchNifi.selectProcessor('InvokeHTTP');
            workbenchNifi.pushStop();
            break;
        }
        case 'LDIO': {
            workbenchLdio.pause(pipeline);
            break;
        }
        default:
            throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I resume the {string} pipeline on the {string} workbench', (pipeline: string, workbench: string) => {
    switch (workbench) {
        case 'NIFI': {
            workbenchNifi.openWorkflow();
            workbenchNifi.selectProcessor('InvokeHTTP');
            workbenchNifi.pushStart();
            break;
        }
        case 'LDIO': {
            workbenchLdio.resume(pipeline);
            break;
        }
        default:
            throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I start the LDES Discoverer', () => {
    createAndStartService(ldesDiscoverer.serviceName);
})

export function createAndStartService(service: string, additionalEnvironmentSettings?: EnvironmentSettings) {
    return dockerCompose.create(service, additionalEnvironmentSettings)
        .then(() => dockerCompose.start(service, additionalEnvironmentSettings));
}

export function stopAndRemoveService(service: string) {
    return dockerCompose.stopContainerAndRemoveVolumesAndImage(service);
}

When('I start the JSON Data Generator', () => {
    createAndStartService(jsonDataGenerator.serviceName, {JSON_DATA_GENERATOR_SILENT: false})
        .then(() => jsonDataGenerator.waitAvailable());
})

When('the LDES contains {int} members', (count: number) => {
    postgres.checkCount(ldesMemberCollection, count);
})

When('the LDES contains {int} fragments', (count: number) => {
    postgres.checkCount(ldesFragmentCollection, count);
})

When('the LDES contains at least {int} members', (count: number) => {
    postgres.checkCount(ldesMemberCollection, count, (x, y) => x >= y);
})

When('the LDES fragment {string} contains at least {int} members', (fragmentId: string, count: number) => {
    postgres.checkFragmentMemberCount(fragmentId, count, (x, y) => x >= y);
})

When('the LDES contains at least {int} fragments', (count: number) => {
    postgres.checkCount(ldesFragmentCollection, count, (x, y) => x >= y);
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

When('I start the GTFS2LDES service', () => {
    createAndStartService(gtfs2ldes.serviceName).then(() => gtfs2ldes.waitAvailable());
})

When('the GTFS to LDES service starts sending linked connections', () => {
    gtfs2ldes.waitSendingLinkedConnections();
})

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

Then('the sink contains {int} members in collection {string}', (count: number, collectionName: string) => {
    sink.checkCount(collectionName, count);
})

export function currentMemberCount() {
    return postgres.count(ldesMemberCollection);
}

Then('the LDES should contain {int} members', (memberCount: number) => {
    currentMemberCount().then(count => expect(count).to.equal(memberCount));
})

Then('the LDES member count increases', () => {
    currentMemberCount().then(currentCount =>
        postgres.checkCount(ldesMemberCollection, currentCount,
            (actual, expected) => actual > expected));
})

Then("the LDES structure contains {int} relations", (relationCount: number) =>
    ldesDiscoverer.checkRelationCount(relationCount)
)

Then("the LDES structure is equal to {string}", (expectedOutputFileName: string) => {
    ldesDiscoverer.checkOutputStructure(`${testContext.testPartialPath}/data/${expectedOutputFileName}`)
})
