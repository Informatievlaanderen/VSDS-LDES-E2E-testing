/// <reference types="cypress" />

import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { sink } from "./common_step_definitions";

// Then stuff

Then('eventually the sink contains about {int} members', (count: number) => {
    const delta = count * 0.20;
    sink.checkCount('mobility-hindrances', count, (actual, expected) => expected - delta < actual && actual <= 2 * expected);
})

Then('the sink log contains no warnings', () => {
    sink.checkLogHasNoWarnings();
})

Then('the sink received every member only once', () => {
    sink.checkLogHasNoWarnings('overriding id');
})