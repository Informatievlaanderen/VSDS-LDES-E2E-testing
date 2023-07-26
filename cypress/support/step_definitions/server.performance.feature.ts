import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { currentMemberCount, gtfs2ldes, setAdditionalEnvironmentSetting } from "./common_step_definitions";
import { PerformanceTimer } from "../performance-timer";
import { timeouts } from "../common";

let throttleRate = 100;
Given('I have configured the GTFS trottle rate as {int}', (value: number) => {
    throttleRate = value;
    setAdditionalEnvironmentSetting('THROTTLE_RATE', `${value}`);
})

function validateSentCount() {
    return gtfs2ldes.sendLinkedConnectionCount().then(sentCount =>
        currentMemberCount().then(receivedCount => {
            const difference = sentCount  - receivedCount;
            return cy
                .log(`Linked connections sent: ${sentCount}, received: ${receivedCount}, difference: ${difference}`)
                .then(() => ({ difference: difference, sentCount: sentCount, receivedCount: receivedCount }));
        }).then((counts) => {
            expect(counts.difference).not.to.be.greaterThan(throttleRate);
            return counts.sentCount;
        })
    );
}

let averageIngestRate = 0;
Then('the LDES server ingests linked connections for {int} seconds without lagging behind more than the throttle rate',
    (seconds: number) => {
        const timer = new PerformanceTimer();
        let previousSentCount = 0;
        cy.waitUntil(() => validateSentCount()
                .then(sentCount => cy.log(`Last ingest rate : ${(sentCount-previousSentCount) * 1000/timer.lap} / second`).then(() => previousSentCount = sentCount))
                .then(sentCount => cy.log(`Running average  : ${sentCount * 1000/timer.end} / second`))
                .then(() => timer.end/1000 > seconds), { timeout: seconds * 1000, interval: timeouts.check })
            .then(() => averageIngestRate = previousSentCount * 1000/timer.end)
            .then(average => cy.task('log', `\tAverage ingest rate: ${average}`));
        });

Then('the LDES server ingests linked connections in average at least at {int} members per second', (rate: number) =>{
    expect(averageIngestRate).not.to.be.lessThan(rate);
});
