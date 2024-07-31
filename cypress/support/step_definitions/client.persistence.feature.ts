/// <reference types="cypress" />

import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { clientWorkbench, dockerCompose, sink } from "./common_step_definitions";

// When stuff

When('I stop the LDES Client LDIO workbench', () => {
    dockerCompose.stop(clientWorkbench.serviceName);
})

When('I restart the LDES Client LDIO workbench', () => {
    dockerCompose.start(clientWorkbench.serviceName);
})

// Then stuff

Then('the sink collection {string} contains at least {int} members', (collectionName: string, count: number) => {
    const delta = count * 0.20;
    sink.checkCount(collectionName, count, (actual, expected) => actual >= expected);
})

Then('the sink log contains no warnings', () => {
    sink.checkLogHasNoWarnings();
})

Then('the sink received every member only once', () => {
    sink.checkLogHasNoWarnings('overriding id');
})