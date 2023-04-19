import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { mongo } from "./common_step_definitions";
import { Fragment } from "../ldes";

let lastMemberCount;

When('I remember the last fragment member count', () => {
    mongo.fragments('iow_devices', 'ldesfragment')
        .then(fragments => fragments.pop())
        .then(partialUrl => new Fragment(`http://localhost:8080${partialUrl}`)
            .visit()
            .then(fragment => cy.log(`Member count: ${fragment.memberCount}`)
            .then(() => lastMemberCount = fragment.memberCount))
        );
})

Then('the last fragment member count increases', () => {
    cy.waitUntil(() => 
        mongo.fragments('iow_devices', 'ldesfragment')
            .then(fragments => fragments.pop())
            .then(partialUrl => new Fragment(`http://localhost:8080${partialUrl}`)
                .visit()
                .then(fragment => cy.log(`New member count: ${fragment.memberCount}`)
                .then(() => fragment.memberCount > lastMemberCount))
            ),
        { timeout: 5000, interval: 1000 });
})
