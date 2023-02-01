import { Given, When, Then, After, Before } from "@badeball/cypress-cucumber-preprocessor";
import { credentials, DockerCompose, LdesServerSimulator, LdesWorkbenchNiFi } from '../../support'
import { LdesClientSink } from "../../support/ldes-client-sink";

const dockerCompose = new DockerCompose("support/context/simulator-workflow-sink-mongo/docker-compose.yml", {
    USECASE_NAME: "gipod-replicate-and-sync-ldes",
});

const apacheNifiUrl = 'https://localhost:8443';
const simulatorUrl = 'http://localhost:9011';
const sinkUrl = 'http://localhost:9003';

before(() => {
    dockerCompose.up(() => workbench.isReady());
});

afterEach(() => {
    simulator.deleteFragments();
    sink.deleteMember();
});

after(() => {
    dockerCompose.down();
});

const simulator = new LdesServerSimulator(simulatorUrl);
const workbench = new LdesWorkbenchNiFi(apacheNifiUrl)
const sink = new LdesClientSink(sinkUrl);

Given('a Simulator-Workflow-Sink-Mongo context is started', () => {
    simulator.getAvailableFragmentsAndAliases().then(response => expect(response.isOkStatusCode).to.be.true);
})

Given('I have aliased the simulator\'s pre-seeded data set', () => {
    simulator.seed(Cypress.env('gipodDataSet'));
    simulator.postAlias('use-cases/gipod/1.replicate-ldes/create-alias.json');
});

Given('I have logged on to the Apache NiFi UI', () => {
    workbench.logon(credentials);
});

Given('I have uploaded {string} workflow', (testName: string) => {
    cy.intercept('**/upload').as('upload');
    workbench.uploadWorkflow(`use-cases/gipod/${testName}/nifi-workflow.json`);
})

When('I start the workflow', () => {
    cy.wait('@upload').then(upload => {
        const processGroupId = upload.response.body.id;
        return cy.get('#operation-context-id').should('have.text', processGroupId);
    });

    workbench.pushStart();
})

Then('the sink contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})

Given('I have seeded the simulator with an initial data set', () => {
    ['alfa', 'beta'].forEach(baseName => simulator.postFragment(`use-cases/gipod/3.synchronize-ldes/data/${baseName}.jsonld`));
    simulator.postFragment('use-cases/gipod/3.synchronize-ldes/data/gamma.jsonld', 10);
    simulator.postAlias('use-cases/gipod/3.synchronize-ldes/create-alias.json');
})

Given('I started the workflow', () => {
    workbench.pushStart();
})

Given('the sync contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})
When('I seed a data set update', () => {
    simulator.postFragment('use-cases/gipod/3.synchronize-ldes/data/delta.jsonld', 10);
})

When('I seed another data set update', () => {
    simulator.postFragment('use-cases/gipod/3.synchronize-ldes/data/epsilon.jsonld', 10);
})
