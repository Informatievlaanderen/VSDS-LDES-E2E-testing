import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { currentMemberCount, gtfs2ldes } from "./common_step_definitions";
import { PerformanceTimer } from "../performance-timer";
import { timeouts } from "../common";
import { SentCount } from "../services/gtfs2ldes";

interface SentReceivedCount extends SentCount {
    received: number;
}

let averageIngestRate = 0;
Then('the LDES server ingests linked connections for {int} seconds',
    (seconds: number) => {
        const timer = new PerformanceTimer();
        let counts: SentReceivedCount = { done: false, sent: 0, received: 0 };
        cy.waitUntil(() =>
            gtfs2ldes.sendLinkedConnectionCount().then((sentCount: SentCount) => currentMemberCount().then(receivedCount => {
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
