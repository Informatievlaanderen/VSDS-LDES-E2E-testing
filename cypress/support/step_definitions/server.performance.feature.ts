import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { currentMemberCount, gtfs2ldes, setAdditionalEnvironmentSetting } from "./common_step_definitions";
import { PerformanceTimer } from "../performance-timer";

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
            expect(counts.difference).to.be.lessThan(throttleRate);
            return counts.sentCount;
        })
    );
}

Then('the LDES server can ingest {int} linked connections within {int} seconds checking every {int} seconds',
    (count: number, seconds: number, interval: number) => {
        const timer = new PerformanceTimer();
        let previousSentCount = 0;
        cy.waitUntil(() => validateSentCount()
            .then(sentCount => cy.log(`Rate   : ${(sentCount-previousSentCount) * 1000/timer.lap}`).then(() => previousSentCount = sentCount))
            .then(sentCount => cy.log(`Average: ${sentCount * 1000/timer.end}`).then(() => sentCount))
            .then(sentCount => sentCount >= count),
        { timeout: seconds * 1000, interval: interval * 1000 });
    })
