import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Relation } from "../ldes";
import { currentMemberCount, gtfs2ldes, server, setAdditionalEnvironmentSetting, workbench } from "./common_step_definitions";

let rootFragment: Fragment;
let timebasedFragment: Fragment;
let mobilityHindrancesLdes = 'mobility-hindrances';
let connectionsLdes = 'connections';
let byLocation = 'by-location';
let byLocationAndTime = 'by-location-and-time';
let byTime = 'by-time';
let byPage = 'by-page';
let relations: Relation[];
let members = ['https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10496796/1192116'];

let throttleRate = 100;


Given('I have configured the GTFS trottle rate as {int}', (value: number) => {
    throttleRate = value;
    setAdditionalEnvironmentSetting('THROTTLE_RATE', `${value}`);
})

Given('the gtfs ingest endpoint is ready', () => {
    workbench.waitIngestEndpointAvailable('http://localhost:9005/gtfs');
})

Then('the geo-spatial root fragment is not immutable', () => {
    server.checkRootFragmentMutable(mobilityHindrancesLdes, byLocation).then(fragment => rootFragment = fragment);
})

Then('the multi-level root fragment is not immutable', () => {
    server.checkRootFragmentMutable(mobilityHindrancesLdes, byLocationAndTime).then(fragment => rootFragment = fragment);
})

Then('the multi-view root fragment is not immutable', () => {
    server.checkRootFragmentMutable(mobilityHindrancesLdes, byTime).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} contains the member', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${mobilityHindrancesLdes}/${byLocation}?tile=${tile}`;
    const relation = relations.find(x => x.link === relationUrl);
    expect(relation).not.to.be.undefined;
    new Fragment(relationUrl).visit().then(fragment => expect(fragment.members.map(x => x.id)).to.eql(members));
})

Then('the multi-view root fragment contains multiple relations of type {string}', (relationType: string) => {
    relations = rootFragment.expectMultipleRelationOf(relationType, 4);
})

Then('the geo-spatial fragmentation exists in the connections LDES', () => {
    server.expectViewUrlNotToBeUndefined(connectionsLdes, byLocationAndTime).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragmentation exists in the mobility-hindrances LDES', () => {
    server.expectViewUrlNotToBeUndefined(mobilityHindrancesLdes, byLocationAndTime).then(fragment => rootFragment = fragment);
})

Then('the time-based fragmentation exists', () => {
    server.expectViewUrlNotToBeUndefined(mobilityHindrancesLdes, byTime).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} has a second level timebased fragmentation which contains the members', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${mobilityHindrancesLdes}/${byLocationAndTime}?tile=${tile}`;
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
            { timeout: seconds * 1000, interval: interval * 1000 });
    })

When('the GTFS to LDES service starts sending linked connections', () => {
    gtfs2ldes.isSendingLinkedConnections();
})

Then('the pagination fragmentation exists in the connections LDES', () => {
    server.expectViewUrlNotToBeUndefined(connectionsLdes, byPage).then(fragment => rootFragment = fragment);
})

Then('the first page contains {int} members', (count: number) => {
    expect(rootFragment.memberCount).to.equal(count);
})

Then('the geo-spatial root fragment contains only relations of type {string}', (relationType: string) => {
    relations = rootFragment.expectMultipleRelationsOfType(relationType);
})

Then('the first timebased second level fragment contains {int} relation of type {string}', (count: number, type: string) => {
    new Fragment(relations[0].link).visit().then(fragment => {
        const relation = fragment.relation;
        expect(relation).not.to.be.undefined;
        return new Fragment(relation.link).visit().then(fragment => {
            timebasedFragment = fragment;
            expect(fragment.relations.length).to.equal(count);
            expect(fragment.expectNoOtherRelationThan(type));
        });
    });
})

Then('the first timebased second level fragment contains arrival and departure stops', () => {
    const members = timebasedFragment.members;
    members.forEach(member => {
        expect(member.arrivalStop).not.to.be.undefined;
        expect(member.departureStop).not.to.be.undefined;
    });
})
