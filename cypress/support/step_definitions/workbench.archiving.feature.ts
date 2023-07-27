import {LdesWorkbenchLdio} from "../services";
import {Given, Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {
    createAndStartService,
    setAdditionalEnvironmentSetting,
    testPartialPath,
    workbenchNifi
} from "./common_step_definitions";
import { checkSuccess } from "..";

const createLdioWorkbench = new LdesWorkbenchLdio(undefined, 'ldio-create-archive');
const readLdioWorkbench = new LdesWorkbenchLdio(undefined, 'ldio-read-archive');
const archiveFolder = 'data/archive';

Given('I have configured the archive directory', () => {
    if (Cypress.platform === 'linux') {
        cy.exec('echo "$(id -u):$(id -g)"').then(result => {
            setAdditionalEnvironmentSetting('WORKFLOW_USER', result.stdout);
            checkSuccess(result).then(success => expect(success).to.be.true);
        })
    }
    setAdditionalEnvironmentSetting('ARCHIVE_DIR', `../../${archiveFolder}`);
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

Then('I clean up the {string} workbench archive', (workbench: string) => {
    const cmd =`rm -rf ./${archiveFolder}/${workbench.toLowerCase()}/2022`;
    cy.log(cmd).exec(cmd, {failOnNonZeroExit: false}).then(result => checkSuccess(result));
})
