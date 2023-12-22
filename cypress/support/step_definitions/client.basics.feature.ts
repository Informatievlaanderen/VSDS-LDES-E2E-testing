/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { clientWorkbench, simulator, testPartialPath } from "./common_step_definitions";

Then('the Client CLI contains {int} members', (count: number) => {
    clientWorkbench.checkCount(count);
})

Given('I have uploaded the data files: {string}', (dataSet: string) => {
    simulator.waitAvailable();
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testPartialPath()}/data/${baseName}.ttl`));
})

Given('I have uploaded the data files: {string} with a duration of {int} seconds', (files: string, seconds: number) => {
    simulator.waitAvailable();
    files.split(',').forEach(baseName => simulator.postFragment(`${testPartialPath()}/data/${baseName}.ttl`, seconds));
})

When('I upload the data files: {string} with a duration of {int} seconds', (files: string, seconds: number) => {
    simulator.waitAvailable();
    files.split(',').forEach(baseName => simulator.postFragment(`${testPartialPath()}/data/${baseName}.ttl`, seconds));
})
