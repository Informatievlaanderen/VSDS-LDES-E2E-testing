import {Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {LdesWorkbenchLdio} from "../services";
import {createAndStartService} from "./common_step_definitions";
import {EventStream} from "../ldes";

export const workbenchLdio = new LdesWorkbenchLdio('http://localhost:8080', 'ldio-oauth-ldes-client');

When('I start the LDIO workflow with an OAUTH2 enabled client', () => {
    createAndStartService(workbenchLdio.serviceName).then(() => workbenchLdio.waitAvailable());
})

Then('the collection at {string} is forbidden', (url: string) => {
    new EventStream(url).waitForResponseCode(403);
})
