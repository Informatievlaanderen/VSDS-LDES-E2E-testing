import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { mongo, setTargetUrl } from "./common_step_definitions";
import { Fragment } from "../ldes";

let lastMemberCount;

Given('the ldesfragment collection is structured as expected', () => {
    const expected: string[] = ['class', 'fragmentPairs', 'immutable', 'members', 'relations', 'root', 'viewName'];
    cy.exec(`curl 'http://localhost:9019/iow_devices/ldesfragment?includeDocuments=true' | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'`, { failOnNonZeroExit: false })
        .then(result => {
            expected.forEach(element => {
                expect(result.stdout).to.contain(element);
            });
        })
})

Given('the ldesmember collection is structured as expected', () => {
    const expected: string[] = ['class', 'ldesMember'];
    cy.exec(`curl 'http://localhost:9019/iow_devices/ldesmember?includeDocuments=true' | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'`, { failOnNonZeroExit: false })
        .then(result => {
            expected.forEach(element => {
                expect(result.stdout).to.contain(element);
            });
        })
})

When('I remember the last fragment member count', () => {
    mongo.fragments('iow_devices', 'ldesfragment')
        .then(fragments => fragments.pop())
        .then(partialUrl => new Fragment(`http://localhost:8080${partialUrl}`)
            .visit()
            .then(fragment => cy.log(`Member count: ${fragment.memberCount}`)
                .then(() => lastMemberCount = fragment.memberCount)
            )
        );
})

Then('the last fragment member count increases', () => {
    cy.waitUntil(() =>
        mongo.fragments('iow_devices', 'ldesfragment')
            .then(fragments => fragments.pop())
            .then(partialUrl => new Fragment(`http://localhost:8080${partialUrl}`)
                .visit()
                .then(fragment => cy.log(`New member count: ${fragment.memberCount}`)
                    .then(() => lastMemberCount < fragment.memberCount)
                )
            ),
        { timeout: 5000, interval: 1000 });
})

When('I set the TARGETURL to the old LDIO', () => {
    setTargetUrl("http://old-ldio:8080/pipeline");
})

When('I set the TARGETURL to the new LDIO', () => {
    setTargetUrl("http://new-ldio:8080/pipeline");
})

Then('the ldesfragment collection on the new server is structured as expected', () => {
    // immutableTimestamp not always present
    const expected: string[] = ['class', 'fragmentPairs', 'immutable', 'numberOfMembers',
     'parentId', 'relations', 'root', 'softDeleted', 'viewName'];
    cy.exec(`curl 'http://localhost:9019/iow_devices/ldesfragment?includeDocuments=true' | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'`, { failOnNonZeroExit: false })
        .then(result => {
            expected.forEach(element => {
                expect(result.stdout).to.contain(element);
            });
        })
})

Then('the ldesmember collection on the new server is structured as expected', () => {
    const expected: string[] = ['class', 'model', 'timestamp', 'treeNodeReferences', 'versionOf'];
    cy.exec(`curl 'http://localhost:9019/iow_devices/ldesmember?includeDocuments=true' | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'`, { failOnNonZeroExit: false })
        .then(result => {
            expected.forEach(element => {
                expect(result.stdout).to.contain(element);
            });
        })
})

