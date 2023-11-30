/// <reference types="cypress" />
import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesClientWorkbench } from "../services/ldes-client-workbench";
import { createAndStartService, startNifiWorkbench } from "./common_step_definitions";

export const clientWorkbench = new LdesClientWorkbench('http://localhost:8081');

function startClientWorkbench(){
    createAndStartService(clientWorkbench.serviceName).then(() => clientWorkbench.waitAvailable());
}

Then('the Client CLI contains {int} members', (count: number) => {
    clientWorkbench.checkCount(count);
})


When('I start the LDES Client {string} workbench', (workbench) => {
    switch (workbench) {
        case 'NIFI': {
            startNifiWorkbench();
            break;
        }
        case 'LDIO': {
            startClientWorkbench();
            break;
        }
        default: throw new Error(`Unknown workbench '${workbench}'`);
    }
})