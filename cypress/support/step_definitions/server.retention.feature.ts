/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { createAndStartService, stopAndRemoveService, currentMemberCount, server, testPartialPath } from "./common_step_definitions";
import { MemberGenerator } from "../services";
import { PerformanceTimer } from "../performance-timer";
import { timeouts } from "../common";

export const firstMemberGenerator = new MemberGenerator('first-test-message-generator');
export const secondMemberGenerator = new MemberGenerator('second-test-message-generator');

When('I add a view with {string} retention', (view) => {
    server.sendConfiguration(testPartialPath(), `seed.${view}.sh`);
});

Given('I start the message generator', () => {
    createAndStartService(firstMemberGenerator.serviceName).then(() => firstMemberGenerator.waitAvailable());
})

When('I stop the message generator', () => {
    stopAndRemoveService(firstMemberGenerator.serviceName);
})

When('I start the second message generator', () => {
    createAndStartService(secondMemberGenerator.serviceName).then(() => secondMemberGenerator.waitAvailable());
})

When('I stop the second message generator', () => {
    stopAndRemoveService(secondMemberGenerator.serviceName);
})

When('eventually there are at least {int} members in the database', (expected: number) => {
    cy.waitUntil(() => currentMemberCount().then(count => count >= expected), { timeout: timeouts.ready, interval: timeouts.slowCheck });
})

When('eventually there are {int} members in the database', (expected: number) => {
    cy.waitUntil(() => currentMemberCount().then(count => count === expected), { timeout: timeouts.ready, interval: timeouts.slowCheck });
})

Then('the member count remains around {int} for {int} seconds', (expected: number, seconds: number) => {
    const epsilon = 2;
    const min = expected - 2 * epsilon;
    const max = expected + 5 * epsilon; // Note: we have to keep this large enough to allow for async character of the retention mechanism
    const timer = new PerformanceTimer();

    cy.waitUntil(() => currentMemberCount().then(count => cy.log(`Current member count: ${count}`)
        .then(() => {
            expect(count).to.be.gte(min);
            expect(count).to.be.lte(max);
        })
        .then(() => timer.end / 1000 > seconds)), { timeout: seconds * 1000, interval: timeouts.check });
})

Then('eventually the member count remains constant for {int} seconds', (seconds: number) => {
    let lastCount = 0;
    let previousCount = 0;
    cy.waitUntil(() => currentMemberCount().then(count => cy.log(`Stabilizing member count: ${count}`)
        .then(() => (previousCount = lastCount, lastCount = count, count === previousCount))), { timeout: timeouts.ready, interval: timeouts.slowCheck })
        .then(() => {
            const timer = new PerformanceTimer();
            cy.waitUntil(() => currentMemberCount().then(count => cy.log(`Current member count: ${count}`)
                .then(() => expect(count).to.equal(lastCount))
                .then(() => timer.end / 1000 > seconds)), { timeout: seconds * 1000, interval: timeouts.check });
        });
})

Then('the member count increases for {int} seconds', (seconds: number) => {
    const timer = new PerformanceTimer();
    let previousCount = 0;
    cy.waitUntil(() => currentMemberCount().then(count => cy.log(`Current member count: ${count}`)
        .then(() => expect(count).gt(previousCount))
        .then(() => previousCount = count)
        .then(() => timer.end / 1000 > seconds)), { timeout: seconds * 1000, interval: timeouts.check });
})
