/// <reference types="cypress" />
import {  When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { workbench, simulator, testPartialPath } from "./common_step_definitions";

When('I upload the simulator file: {string}', (file: string) => {
    simulator.postFragment(`${testPartialPath()}/simulator/${file}.ttl`);
})

When('I upload the simulator file: {string} with a duration of {int} seconds', (file: string, seconds: number) => {
    simulator.postFragment(`${testPartialPath()}/simulator/${file}.ttl`, seconds);
})

Then('the client console contains {int} members', (count: number) => {
    workbench.checkConsoleCount(count);
})
