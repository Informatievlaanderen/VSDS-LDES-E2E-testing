import {LdesWorkbenchLdio, LdesWorkbenchNiFi} from "../services";
import {Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {credentials} from "../credentials";
import {createAndStartService, testPartialPath} from "./common_step_definitions";

const createNifiWorkbench = new LdesWorkbenchNiFi('https://localhost:8000', 'nifi-create-archive')
const readNifiWorkbench = new LdesWorkbenchNiFi('http://localhost:8000', 'nifi-read-archive')

const createLdioWorkbench = new LdesWorkbenchLdio(undefined, 'ldio-create-archive');
const readLdioWorkbench = new LdesWorkbenchLdio(undefined, 'ldio-read-archive');

When('I start the create archive {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            createNifiWorkbench.waitAvailable();
            createNifiWorkbench.login(credentials);
            createNifiWorkbench.uploadWorkflow(`${testPartialPath()}/nifi-create-archive-workflow.json`);
            createNifiWorkbench.pushStart();
            break;
        }
        case 'LDIO': {
            createAndStartService(createLdioWorkbench.serviceName).then(() => createLdioWorkbench.waitAvailable());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

When('I start the read archive {string} workbench', (workbench) => {
    switch(workbench) {
        case 'NIFI': {
            createNifiWorkbench.logout();
            createAndStartService(readNifiWorkbench.serviceName).then(() => readNifiWorkbench.waitAvailable());
            readNifiWorkbench.uploadWorkflow(`${testPartialPath()}/nifi-read-archive-workflow.json`);
            readNifiWorkbench.pushStart();
            break;
        }
        case 'LDIO': {
            createAndStartService(readLdioWorkbench.serviceName).then(() => readLdioWorkbench.waitAvailable());
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})

Then('I wait until the archiving is finished', () => {
    createLdioWorkbench.waitForDockerLog('No fragments to mutable or new fragments to process');
})
