import { After, Given, When } from "@badeball/cypress-cucumber-preprocessor";
import { DockerCompose, LdesWorkbenchNiFi, credentials, LdesServerSimulator } from "..";

let dockerCompose : DockerCompose;
export let dockerComposeEnvironment: {[key : string] : any} = {};
export const simulator = new LdesServerSimulator('http://localhost:9011');


const workbench = new LdesWorkbenchNiFi('https://localhost:8443')

Given('context {string} is started', (composeFile: string) => {
    dockerCompose = new DockerCompose(`${composeFile}/docker-compose.yml`, dockerComposeEnvironment);
    dockerCompose.up(() => workbench.isReady());
})

After(() => {
    dockerCompose.down();
});


Given('I have logged on to the Apache NiFi UI', () => {
    workbench.logon(credentials);
});

Given('I have uploaded {string} workflow', (testName: string) => {
    workbench.uploadWorkflow(`use-cases/gipod/${testName}/nifi-workflow.json`);
})

When('I start the workflow', () => {
    workbench.pushStart();
})
