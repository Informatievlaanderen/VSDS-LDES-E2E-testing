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

let averageIngestRate = 0;
Then('the LDES server ingests linked connections for {int} seconds without lagging behind more than the throttle rate',
    (seconds: number) => {
        const timer = new PerformanceTimer();
        let counts: SentReceivedCount = { done: false, sent: 0, received: 0 };
        cy.waitUntil(() =>
            gtfs2ldes.sendLinkedConnectionCount().then((sentCount: SentCount) => currentMemberCount().then(receivedCount => {
                const difference = sentCount.sent - receivedCount;
                expect(difference).not.to.be.greaterThan(throttleRate);
                counts = { ...sentCount, received: receivedCount };
                const runningAverage = counts.received * 1000 / timer.end;
                return cy.task('log', `\tRunning average  : ${Math.round(runningAverage)} / second`).then(() => counts.done || timer.end / 1000 > seconds);
            })), { timeout: seconds * 1000, interval: timeouts.check / 2 })
            .then(() => {
                averageIngestRate = counts.received * 1000 / timer.end;
                cy.task('log', `\tAverage ingest rate: ${Math.round(averageIngestRate)} / second`)
            });
    });

Then('the LDES server ingests linked connections in average at least at {int} members per second', (rate: number) => {
    expect(averageIngestRate).not.to.be.lessThan(rate);
});
