/// <reference types="cypress" />
import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Relation } from "../ldes";
import { byPage, ensureRelationCount, server } from "./common_step_definitions";
import { timeouts } from "../common";

let firstFragment: Fragment;
let middleFragment: Fragment;
let lastFragment: Fragment;

let rootFragment: Fragment;
let paginationRootFragment: Fragment;
let paginationFragment: Fragment;

const mobilityHindrancesLdes = 'mobility-hindrances';
const connectionsLdes = 'connections';
const byLocation = 'by-location';
const byLocationAndPage = 'by-location-and-page';
const byTime = 'by-time';

let relations: Relation[];
let members = ['https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10496796/1192116'];

Then('the first {string} fragment is immutable', (view: string) => {
    server.getLdes('mobility-hindrances')
        .then(ldes => new Fragment(ldes.viewUrl(view)).visit())
        .then(view => new Fragment(view.relation.link).visit())
        .then(fragment => firstFragment = fragment.expectImmutable())
})

Then('the first fragment only has a {string} to the middle fragment', (type: string) => {
    firstFragment.expectNoOtherRelationThan(type);
    const relation = firstFragment.expectSingleRelationOf(type);
    new Fragment(relation.link).visit().then(fragment => middleFragment = fragment);
})

Then('the middle fragment is immutable', () => {
    middleFragment.expectImmutable();
})

Then('the middle fragment only has a {string} to the first and last fragments', (type: string) => {
    middleFragment.expectNoOtherRelationThan(type);

    const expectedCount = 2;
    ensureRelationCount(middleFragment, expectedCount).then(() => {
        const urls = middleFragment.expectMultipleRelationOf(type, expectedCount).map(x => x.link);
        expect(urls).to.contain(firstFragment.url);
    
        const other = urls.find(x => x !== firstFragment.url);
        expect(other).not.to.be.undefined;
    
        // cast is safe as expect guards that other is not undefined
        new Fragment(other as string).visit().then(fragment => lastFragment = fragment);
    });
})

Then('the middle fragment only has a {string} to the first fragment', (type: string) => {
    const relation = middleFragment.expectSingleRelationOf(type);
    expect(relation.link).to.equal(firstFragment.url);
})

Then('the middle fragment only has a {string} to the last fragment', (type: string) => {
    const relation = middleFragment.expectSingleRelationOf(type);
    new Fragment(relation.link).visit().then(fragment => lastFragment = fragment);
})

Then('the last fragment is not immutable', () => {
    lastFragment.expectMutable();
})

Then('the last fragment only has a {string} to the middle fragment', (type: string) => {
    lastFragment.expectNoOtherRelationThan(type);

    const relation = lastFragment.expectSingleRelationOf(type);
    expect(relation.link).to.equals(middleFragment.url);
})


Then('the substring root fragment is not immutable', () => {
    server.checkRootFragmentMutable('addresses', 'by-name').then(fragment => rootFragment = fragment);
})

Then('the root fragment contains {string} relations with values: {string}', (relationType: string, relationValues: string) => {
    rootFragment.expectMutable();

    const values = relationValues.split(',');
    const expectedCount = values.length;

    ensureRelationCount(rootFragment, expectedCount).then(() => {
        const relations = rootFragment.expectMultipleRelationOf(relationType, expectedCount);
        values.forEach(value => {
            const relation = relations.filter(x => x.value === value).shift();
            expect(relation).not.to.be.undefined;
            expect(relation?.path).to.equal('https://data.vlaanderen.be/ns/adres#volledigAdres');
            expect(relation?.link).to.equal(`${rootFragment.url}${value}`);
        });
    });
});

Then('the fragment exists for substring {string}', (fragmentValues: string) => {
    const values = fragmentValues.split(',');
    values.forEach(value => {
        new Fragment(`${rootFragment.url}${value}`).visit().then(fragment => expect(fragment.success).to.be.true);
    });
})

Then('the geo-spatial root fragment is not immutable', () => {
    server.checkRootFragmentMutable(mobilityHindrancesLdes, byLocation).then(fragment => rootFragment = fragment);
})

Then('the multi-level root fragment is not immutable', () => {
    server.checkRootFragmentMutable(mobilityHindrancesLdes, byLocationAndPage).then(fragment => rootFragment = fragment);
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
    const expectedCount = 4;
    ensureRelationCount(rootFragment, expectedCount).then(() => {
        relations = rootFragment.expectMultipleRelationOf(relationType, expectedCount);
    });
})

Then('the geo-spatial fragmentation exists in the connections LDES', () => {
    server.expectViewUrlNotToBeUndefined(connectionsLdes, byLocationAndPage).then(fragment => rootFragment = fragment);
})

Then('the mobility-hindrances LDES is geo-spatially fragmented', () => {
    server.expectViewUrlNotToBeUndefined(mobilityHindrancesLdes, byLocation).then(fragment => rootFragment = fragment);
})

Then('the mobility-hindrances LDES is paginated', () => {
    server.expectViewUrlNotToBeUndefined(mobilityHindrancesLdes, byPage).then(fragment => rootFragment = fragment);
})

Then('the connections LDES is paginated', () => {
    server.expectViewUrlNotToBeUndefined(connectionsLdes, byPage).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} is sub-fragmented using pagination which contains the members', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${mobilityHindrancesLdes}/${byLocationAndPage}?tile=${tile}`;
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
    ensureRelationCount(rootFragment, amount).then(() => {
        relations = rootFragment.expectMultipleRelationOf(relationType, amount);
    });
})

Then('the pagination root fragment contains {int} relation of type {string}', (amount: number, relationType: string) => {
    ensureRelationCount(rootFragment, amount).then(() => {
        relations = rootFragment.expectMultipleRelationOf(relationType, amount);
    });
})

Then('the first page contains {int} members', (count: number) => {
    cy.waitUntil(() => 
        rootFragment.visit().then(x => x.memberCount === count), 
        { timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: `Timed out waiting for fragment '${rootFragment.url}' to have ${count} members`}
    )    
})

Then('the geo-spatial root fragment contains only relations of type {string}', (relationType: string) => {
    relations = rootFragment.expectMultipleRelationsOfType(relationType);
})

When('I follow the first relation to the second level pagination root fragment', () => {
    new Fragment(relations[0].link).visit().then(fragment => paginationRootFragment = fragment);
})

Then('the pagination fragment contains {int} relation of type {string}', (count: number, type: string) => {
    const relation = paginationRootFragment.relation;
    expect(relation).not.to.be.undefined;
    const url = relation.link;
    expect(url).not.to.be.undefined;

    cy.waitUntil(
            () => new Fragment(url).visit().then(fragment => fragment.relations.length === count), 
            {timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: `Timed out waiting for the pagination fragment '${url}' to have ${count} relations`})
        .then(() => new Fragment(url).visit().then(fragment => {
            paginationFragment = fragment;
            expect(fragment.relations.length).to.equal(count);
            expect(fragment.expectNoOtherRelationThan(type));
        }))
})

Then('all members contains arrival and departure stops', () => {
    const members = paginationFragment.members;
    members.forEach(member => {
        expect(member.arrivalStop).not.to.be.undefined;
        expect(member.departureStop).not.to.be.undefined;
    });
})
