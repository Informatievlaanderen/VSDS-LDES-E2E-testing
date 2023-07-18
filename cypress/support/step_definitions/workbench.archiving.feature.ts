import {LdesWorkbenchLdio} from "../services";
import {Given, Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {
    createAndStartService,
    setAdditionalEnvironmentSetting,
    testPartialPath,
    workbenchNifi
} from "./common_step_definitions";

const createLdioWorkbench = new LdesWorkbenchLdio(undefined, 'ldio-create-archive');
const readLdioWorkbench = new LdesWorkbenchLdio(undefined, 'ldio-read-archive');

Given('I have configured the archive directory', () => {
    cy.exec('id -u').then(uid => setAdditionalEnvironmentSetting('MY_UID', uid.stdout));
    cy.exec('id -g').then(uid => setAdditionalEnvironmentSetting('MY_GID', uid.stdout));
    setAdditionalEnvironmentSetting('ARCHIVE_DIR', Cypress.config('downloadsFolder'));
})

When('I start the create archive {string} workbench', (workbench: string) => {
    switch(workbench) {
        case 'NIFI': {
            createAndStartService(workbenchNifi.serviceName).then(() => workbenchNifi.waitAvailable());
            workbenchNifi.uploadWorkflow(`${testPartialPath()}/nifi-create-archive-workflow.json`);
            workbenchNifi.pushStart();
            break;
        }
        case 'LDIO': {
            createAndStartService(createLdioWorkbench.serviceName).then(() => createLdioWorkbench.waitAvailable());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I start the read archive {string} workbench', (workbench: string) => {
    switch(workbench) {
        case 'NIFI': {
            workbenchNifi.uploadWorkflow(`${testPartialPath()}/nifi-read-archive-workflow.json`);
            workbenchNifi.pushStart();
            break;
        }
        case 'LDIO': {
            createAndStartService(readLdioWorkbench.serviceName).then(() => readLdioWorkbench.waitAvailable());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

Then('I wait until the {string} workbench finished archiving', (workbench: string) => {
    switch(workbench) {
        case 'NIFI': {
            workbenchNifi.waitForDockerLog('No fragments to mutable or new fragments to process');
            break;
        }
        case 'LDIO': {
            createLdioWorkbench.waitForDockerLog('No fragments to mutable or new fragments to process');
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

Then('I cleanup the created archive', () => {
    cy.exec(`rm -rf ${Cypress.config('downloadsFolder')}/2022`);
})
