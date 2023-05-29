import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, dockerCompose, setTargetUrl, testPartialPath, waitUntilMemberCountStable } from "./common_step_definitions";
import { LdesWorkbenchLdio, LdesWorkbenchNiFi } from "../services";
import { credentials } from "../credentials";

const oldNifiWorkbench = new LdesWorkbenchNiFi('https://localhost:8443', 'old-nifi-workbench')
const newNifiWorkbench = new LdesWorkbenchNiFi('http://localhost:8000', 'new-nifi-workbench')

const oldLdioWorkbench = new LdesWorkbenchLdio('http://localhost:8081', 'old-ldio-workbench');
const newLdioWorkbench = new LdesWorkbenchLdio('http://localhost:8082', 'new-ldio-workbench');

Given('the old {string} workbench is available', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            oldNifiWorkbench.waitAvailable();
            oldNifiWorkbench.login(credentials);
            oldNifiWorkbench.uploadWorkflow(`${testPartialPath()}/old-nifi-workflow.json`);
            oldNifiWorkbench.pushStart();
            break;
        }
        case 'LDIO': {
            oldLdioWorkbench.waitAvailable();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I start the new {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            oldNifiWorkbench.logout();
            createAndStartService(newNifiWorkbench.serviceName).then(() => newNifiWorkbench.waitAvailable());
            newNifiWorkbench.uploadWorkflow(`${testPartialPath()}/new-nifi-workflow.json`);
            newNifiWorkbench.pushStart();
            break;
        }
        case 'LDIO': {
            createAndStartService(newLdioWorkbench.serviceName).then(() => newLdioWorkbench.waitAvailable());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I set the TARGETURL to the old {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            setTargetUrl(`http://${oldNifiWorkbench.serviceName}:9012/ngsi/device`);
            break;
        }
        case 'LDIO': {
            setTargetUrl(`http://${oldLdioWorkbench.serviceName}:8080/pipeline`);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I set the TARGETURL to the new {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            setTargetUrl(`http://${newNifiWorkbench.serviceName}:9012/ngsi/device`);
            break;
        }
        case 'LDIO': {
            setTargetUrl(`http://${newLdioWorkbench.serviceName}:8080/pipeline`);
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I pause the new {string} workbench output', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            newNifiWorkbench.openWorkflow();
            newNifiWorkbench.selectProcessor('InvokeHTTP');
            newNifiWorkbench.pushStop();
            break;
        }
        case 'LDIO': {
            newLdioWorkbench.pause();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I resume the new {string} workbench output', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            newNifiWorkbench.openWorkflow();
            newNifiWorkbench.selectProcessor('InvokeHTTP');
            newNifiWorkbench.pushStart();
            break;
        }
        case 'LDIO': {
            newLdioWorkbench.resume();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I bring the old {string} workbench down', (workbench) => {
    let serviceName: string;
    switch(workbench) {
        case 'NIFI': {
            serviceName = oldNifiWorkbench.serviceName;
            break;
        }
        case 'LDIO': {
            serviceName = oldLdioWorkbench.serviceName;
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
    dockerCompose.stopContainerAndRemoveVolumesAndImage(serviceName);
})

Then('the member count does not change', waitUntilMemberCountStable);
