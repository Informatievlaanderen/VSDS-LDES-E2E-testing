import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesClientSink } from '..'
import { simulator } from "./step_definitions";

const sink = new LdesClientSink('http://localhost:9003');

Given('I have aliased the {string} simulators pre-seeded data set', (testName: string) => {
    simulator.isAvailable();
    simulator.seed(Cypress.env('gipodDataSet'));
    simulator.postAlias(`use-cases/gipod/${testName}/create-alias.json`);
})

Then('the sink contains {int} members', (count: number) => {
    sink.checkCount('mobility-hindrances', count);
})


When('I seed a data set update', () => {
    simulator.postFragment('use-cases/gipod/3.synchronize-ldes/data/delta.jsonld', 10);
})

When('I seed another data set update', () => {
    simulator.postFragment('use-cases/gipod/3.synchronize-ldes/data/epsilon.jsonld', 10);
})

