/// <reference types="cypress" />

import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { simulator, sink, dockerCompose } from "./common_step_definitions";

const volumeName = 'ldes-client-state';

// Then stuff

Then('eventually the sink contains about {int} members', (count: number) => {
    const delta = count * 0.20;
    sink.checkCount('mobility-hindrances', count, (actual, expected) => expected - delta < actual && actual <= 2 * expected);
})

Then('all but the first fragment have been requested once', () => {
    const firstFragmentUrl = "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z";

    simulator.getResponses().then(responses => {
        expect(responses[firstFragmentUrl].count).to.greaterThan(1);
        delete responses[firstFragmentUrl];
        Object.keys(responses).forEach(x => { 
            expect(responses[x].count).to.be.equal(1, `Fragment '${x}' should only be called once`); 
        })
    })
})

Given('I have created a persisted store for the LDES client state', () => {
    dockerCompose.createVolume(volumeName);
})

Then('I have to cleanup the persisted store for the LDES client state', () => {
    dockerCompose.removeVolume(volumeName);
})
