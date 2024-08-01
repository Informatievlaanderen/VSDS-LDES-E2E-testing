/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { clientWorkbench, simulator, testPartialPath } from "./common_step_definitions";

When('I upload the simulator file: {string} with a duration of {int} seconds', (file: string, seconds: number) => {
    simulator.postFragment(`${testPartialPath()}/simulator/${file}.ttl`, seconds);
})

// TODO: verify below this line

Given('I have uploaded the data files: {string}', (dataSet: string) => {
    dataSet.split(',').forEach(baseName => simulator.postFragment(`${testPartialPath()}/data/${baseName}.ttl`));
})

Given('I have uploaded the data files: {string} with a duration of {int} seconds', (files: string, seconds: number) => {
    files.split(',').forEach(baseName => simulator.postFragment(`${testPartialPath()}/data/${baseName}.ttl`, seconds));
})

Then('the Client CLI contains {int} members', (count: number) => {
    clientWorkbench.checkCount(count);
})

When('I upload the data files: {string} with a duration of {int} seconds', (files: string, seconds: number) => {
    simulator.waitAvailable();
    files.split(',').forEach(baseName => simulator.postFragment(`${testPartialPath()}/data/${baseName}.ttl`, seconds));
})
