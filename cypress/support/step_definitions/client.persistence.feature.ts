/// <reference types="cypress" />

import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { simulator, sink } from "./common_step_definitions";

// Then stuff

Then('the sink contains around {int} members', (count: number) => {
    const delta = count * 0.20;
    sink.checkCount('mobility-hindrances', count, (actual, expected) => expected - delta <= actual );
})

Then('all but the first fragment have been requested once', () => {
    const firstFragmentUrl = "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z";

    simulator.getResponses().then(responses => {
        expect(responses[firstFragmentUrl].count).to.greaterThan(1);
        delete responses[firstFragmentUrl];
        Object.keys(responses).forEach(x => { expect(responses[x].count).to.be.equal(1); })
    })
})
