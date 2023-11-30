/// <reference types="cypress" />
import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { clientWorkbench } from "./common_step_definitions";

Then('the Client CLI contains {int} members', (count: number) => {
    clientWorkbench.checkCount(count);
})
