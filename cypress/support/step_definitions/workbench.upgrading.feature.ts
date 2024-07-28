import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, stopAndRemoveService, setTargetUrl, waitUntilMemberCountStable } from "./common_step_definitions";
import { LdesWorkbenchLdio } from "../services";

const oldLdioWorkbench = new LdesWorkbenchLdio('http://localhost:8081', 'old-ldio-workbench');
const newLdioWorkbench = new LdesWorkbenchLdio('http://localhost:8082', 'new-ldio-workbench');

Given('the old {string} workbench is available', (workbench) => {
    switch(workbench) {
        case 'LDIO': {
            oldLdioWorkbench.waitAvailable();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I start the new {string} workbench', (workbench) => {
    switch(workbench) {
        case 'LDIO': {
            createAndStartService(newLdioWorkbench.serviceName)
                .then(() => newLdioWorkbench.waitAvailable())
                .then(() => newLdioWorkbench.waitForPipelinesRunning());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I set the TARGETURL to the old {string} workbench', (workbench) => {
    switch(workbench) {
        case 'LDIO': {
            setTargetUrl(`http://${oldLdioWorkbench.serviceName}:8080/upgrade-pipeline`);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I set the TARGETURL to the new {string} workbench', (workbench) => {
    switch(workbench) {
        case 'LDIO': {
            setTargetUrl(`http://${newLdioWorkbench.serviceName}:8080/upgrade-pipeline`);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I pause the {string} pipeline on the new {string} workbench', (pipeline: string, workbench: string) => {
    switch(workbench) {
        case 'LDIO': {
            newLdioWorkbench.pause(pipeline);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I resume the {string} pipeline on the new {string} workbench', (pipeline: string, workbench: string) => {
    switch(workbench) {
        case 'LDIO': {
            newLdioWorkbench.resume(pipeline);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I bring the old {string} workbench down', (workbench) => {
    let serviceName: string;
    switch(workbench) {
        case 'LDIO': {
            serviceName = oldLdioWorkbench.serviceName;
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
    stopAndRemoveService(serviceName);
})

Then('the member count does not change', waitUntilMemberCountStable);
