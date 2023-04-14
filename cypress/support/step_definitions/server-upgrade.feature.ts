import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { LdesListFragments } from "../services";
import { createAndStartService } from "./common_step_definitions";
import { Fragment } from "../ldes";

const ldesListFragments = new LdesListFragments();
let lastFragmentUrl;
let lastMemberCount;

When('I remember the last fragment member count', () => {
    createAndStartService(ldesListFragments.serviceName)
        .then(() => ldesListFragments.lastFragment().then(url => lastFragmentUrl = url)
            .then(() => new Fragment(lastFragmentUrl).visit()
                .then(fragment => cy.log(`Member count: ${fragment.memberCount}`).then(() => lastMemberCount = fragment.memberCount))));
})

Then('the last fragment member count increases', () => {
    cy.waitUntil(() => new Fragment(lastFragmentUrl).visit()
        .then(fragment => cy.log(`New member count: ${fragment.memberCount}`)
            .then(() => fragment.memberCount > lastMemberCount)),
            { timeout: 5000, interval: 1000 });
})
