import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Relation } from "../ldes";
import { currentMemberCount, gtfs2ldes, server, setAdditionalEnvironmentSetting } from "./common_step_definitions";

let rootFragment: Fragment;
let ldesName = 'mobility-hindrances';
let byLocation = 'by-location';
let byLocationAndTime = 'by-location-and-time';
let byTime = 'by-time';
let relations: Relation[];
let members = ['https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10496796/1192116'];

let throttleRate = 100;


Given('I have configured the GTFS trottle rate as {int}', (value: number) => {
    throttleRate = value;
    setAdditionalEnvironmentSetting('THROTTLE_RATE', `${value}`);
})

Then('the geo-spatial root fragment is not immutable', () => {
    server.checkRootFragmentMutable(ldesName, byLocation).then(fragment => rootFragment = fragment);
})

Then('the multi-level root fragment is not immutable', () => {
    server.checkRootFragmentMutable(ldesName, byLocationAndTime).then(fragment => rootFragment = fragment);
})

Then('the multi-view root fragment is not immutable', () => {
    server.checkRootFragmentMutable(ldesName, byTime).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} contains the member', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${ldesName}/${byLocation}?tile=${tile}`;
    const relation = relations.find(x => x.link === relationUrl);
    expect(relation).not.to.be.undefined;
    new Fragment(relationUrl).visit().then(fragment => expect(fragment.members.map(x => x.id)).to.eql(members));
})

Then('the multi-view root fragment contains multiple relations of type {string}', (relationType: string) => {
    relations = rootFragment.expectMultipleRelationOf(relationType, 4);
})

Then('the geo-spatial fragmentation exists', () => {
    server.expectViewUrlNotToBeUndefined(ldesName, byLocationAndTime).then(fragment => rootFragment = fragment);
})

Then('the time-based fragmentation exists', () => {
    server.expectViewUrlNotToBeUndefined(ldesName, byTime).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} has a second level timebased fragmentation which contains the members', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${ldesName}/${byLocationAndTime}?tile=${tile}`;
    const relation = relations.find(x => x.link === relationUrl);
    expect(relation).not.to.be.undefined;
    new Fragment(relationUrl).visit().then(fragment => {
        const relation = fragment.relation;
        expect(relation).not.to.be.undefined;
        return new Fragment(relation.link).visit().then(fragment => {
            expect(fragment.members.length).to.equal(5);
            return new Fragment(fragment.relation.link).visit().then(fragment => expect(fragment.members.length).to.equal(1));
        });
    });
})

Then('the geo-spatial root fragment contains {int} relations of type {string}', (amount: number, relationType: string) => {
    relations = rootFragment.expectMultipleRelationOf(relationType, amount);
})

Then('the timebased root fragment contains {int} relation of type {string}', (amount: number, relationType: string) => {
    relations = rootFragment.expectMultipleRelationOf(relationType, amount);
})

function validateSentCount() {
    return gtfs2ldes.sendLinkedConnectionCount().then(sentCount =>
        currentMemberCount().then(receivedCount => {
            const difference = sentCount - receivedCount;
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
    cy.waitUntil(() => validateSentCount().then(sentCount => sentCount > count), 
    { timeout: seconds * 1000, interval: interval *1000 });
})

When('the GTFS to LDES service starts sending linked connections', () => {
    gtfs2ldes.isSendingLinkedConnections();
})
