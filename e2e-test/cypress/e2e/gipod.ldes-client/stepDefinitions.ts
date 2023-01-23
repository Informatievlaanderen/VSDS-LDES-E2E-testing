import { Given, When, Then, After, Before } from "@badeball/cypress-cucumber-preprocessor";

// Given(/I have uploaded a workflow with an LDES client/, () => { return "pending"; });
// Given(/I have seeded the simulator with an initial data set/, () => { return "pending"; });
// Given(/I started the workflow/, () => { return "pending"; });
// Given(/the last fragment is being re-requested/, () => { return "pending"; });
// When(/I start the workflow/, () => { return "pending"; });
// When(/I seed a data set update/, () => { return "pending"; });
// Then(/the sink contains the correct number of members ({int})/, (count) => { return "pending"; });

import {credentials, DockerCompose, LdesServerSimulator, LdesWorkbenchNiFi} from '../../support'

const dockerCompose = new DockerCompose("support/context/simulator-workflow-sink-mongo/docker-compose.yml", {
    USECASE_NAME:"gipod-replicate-ldes",
});

const apacheNifiUrl = 'https://localhost:8443';
const simulatorUrl = 'http://localhost:9011';

Before(() => {
    dockerCompose.up(() => cy.exec(`curl ${apacheNifiUrl}/nifi`, {failOnNonZeroExit: false}).then(exec => exec.code === 60));
});

After(() => {
    dockerCompose.down();
});

const simulator = new LdesServerSimulator(simulatorUrl);
const workbench = new LdesWorkbenchNiFi(apacheNifiUrl)

Given('a Simulator-Workflow-Sink-Mongo context is started', () => {
    simulator.getAvailableFragmentsAndAliases().then(() => {
        simulator.seed(Cypress.env('gipodDataSet'));
    });
})

Given('I have aliased the simulator\'s pre-seeded data set', () => {
    simulator.postAlias('use-cases/gipod/1.replicate-ldes/create-alias.json');
});

Given('I have logged on to the Apache NiFi UI', () => {
    workbench.logon(credentials);
});
