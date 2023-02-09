import { After, Given } from "@badeball/cypress-cucumber-preprocessor";
import { DockerCompose, LdesWorkbenchNiFi } from "..";

let dockerCompose : DockerCompose;
export let dockerComposeEnvironment: {[key : string] : any} = {};
const apacheNifiUrl = 'https://localhost:8443';
const workbench = new LdesWorkbenchNiFi(apacheNifiUrl)

Given('context {string} is started', (composeFile: string) => {
    dockerCompose = new DockerCompose(`${composeFile}/docker-compose.yml`, dockerComposeEnvironment);
    dockerCompose.up(() => workbench.isReady());
})

After(() => {
    dockerCompose.down();
});