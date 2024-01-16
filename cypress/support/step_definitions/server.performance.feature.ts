import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { currentMemberCount, gtfs2ldes, setAdditionalEnvironmentSetting } from "./common_step_definitions";
import { PerformanceTimer } from "../performance-timer";
import { timeouts } from "../common";
import { SentCount } from "../services/gtfs2ldes";

let throttleRate = 100;
Given('I have configured the GTFS trottle rate as {int}', (value: number) => {
    throttleRate = value;
    setAdditionalEnvironmentSetting('THROTTLE_RATE', `${value}`);
})

interface SentReceivedCount extends SentCount {
    received: number;
}

function validateCounts(): Cypress.Chainable<SentReceivedCount> {
    return gtfs2ldes.sendLinkedConnectionCount().then((sentCount: SentCount) =>
        currentMemberCount().then(receivedCount => {
            const difference = sentCount.sent - receivedCount;
            expect(difference).not.to.be.greaterThan(throttleRate);
            return { ...sentCount, received: receivedCount };
        })
    );
}

let averageIngestRate = 0;
Then('the LDES server ingests linked connections for {int} seconds without lagging behind more than the throttle rate',
    (seconds: number) => {
        const timer = new PerformanceTimer();
        let counts: SentReceivedCount = { done: false, sent: 0, received: 0 };
        cy.waitUntil(() => validateCounts()
                .then((x: SentReceivedCount) => counts = x)
                .then(() => cy.task('log', `\tRunning average  : ${Math.round(counts.received * 1000/timer.end)} / second`))
                .then(() => counts.done || timer.end/1000 > seconds), { timeout: seconds * 1000, interval: timeouts.check })
            .then(() => averageIngestRate = counts.received * 1000/timer.end)
            .then(average => cy.task('log', `\tAverage ingest rate: ${Math.round(average)} / second`));
        });

Then('the LDES server ingests linked connections in average at least at {int} members per second', (rate: number) =>{
    expect(averageIngestRate).not.to.be.lessThan(rate);
});
