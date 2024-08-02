import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, stopAndRemoveService, setTargetUrl, waitUntilMemberCountStable } from "./common_step_definitions";
import { LdesWorkbenchLdio } from "../services";

const oldLdioWorkbench = new LdesWorkbenchLdio('http://localhost:8081', 'old-ldio-workbench');
const newLdioWorkbench = new LdesWorkbenchLdio('http://localhost:8083', 'new-ldio-workbench');

Given('the old LDIO workbench is available', () => {
    oldLdioWorkbench.waitAvailable();
})

When('I start the new LDIO workbench', () => {
    createAndStartService(newLdioWorkbench.serviceName)
        .then(() => newLdioWorkbench.waitAvailable())
        .then(() => newLdioWorkbench.waitForPipelinesRunning());
})

When('I set the TARGETURL to the old LDIO workbench', () => {
    setTargetUrl(`http://${oldLdioWorkbench.serviceName}:8080/upgrade-pipeline`);
})

When('I set the TARGETURL to the new LDIO workbench', () => {
    setTargetUrl(`http://${newLdioWorkbench.serviceName}:8080/upgrade-pipeline`);
})

When('I pause the {string} pipeline on the new LDIO workbench', (pipeline: string) => {
    newLdioWorkbench.pause(pipeline);
})

When('I resume the {string} pipeline on the new LDIO workbench', (pipeline: string) => {
    newLdioWorkbench.resume(pipeline);
})

When('I bring the old LDIO workbench down', () => {
    let serviceName: string;
    serviceName = oldLdioWorkbench.serviceName;
    stopAndRemoveService(serviceName);
})

Then('the member count does not change', waitUntilMemberCountStable);
