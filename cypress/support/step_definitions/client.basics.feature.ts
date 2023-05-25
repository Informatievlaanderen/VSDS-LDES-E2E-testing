/// <reference types="cypress" />
import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { ClientCli } from "../services/client-cli";
import { createAndStartService } from "./common_step_definitions";

export const clientCli = new ClientCli('http://localhost:8081');

When('I launch the Client CLI', () => {
    createAndStartService(clientCli.serviceName).then(() => clientCli.waitAvailable());
})

Then('the Client CLI contains {int} members', (count: number) => {
    clientCli.checkCount(count);
})
