/// <reference types="cypress" />

import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { clientWorkbench, dockerCompose, sink, workbenchNifi } from "./common_step_definitions";

// When stuff

When('I stop the LDES Client {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            dockerCompose.stop(workbenchNifi.serviceName);
            break;
        }
        case 'LDIO': {
            dockerCompose.stop(clientWorkbench.serviceName);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I restart the LDES Client {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            dockerCompose.start(workbenchNifi.serviceName);
            break;
        }
        case 'LDIO': {
            dockerCompose.start(clientWorkbench.serviceName);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

// Then stuff

Then('eventually the sink collection {string} contains about {int} members', (collectionName: string, count: number) => {
    const delta = count * 0.20;
    sink.checkCount(collectionName, count, (actual, expected) => expected - delta < actual && actual <= 2 * expected);
})

Then('the sink log contains no warnings', () => {
    sink.checkLogHasNoWarnings();
})

Then('the sink received every member only once', () => {
    sink.checkLogHasNoWarnings('overriding id');
})