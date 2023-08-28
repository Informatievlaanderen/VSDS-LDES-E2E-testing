/// <reference types="cypress" />
import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Relation } from "../ldes";
import { byPage, ensureRelationCount, obtainRootFragment, server, waitForFragment } from "./common_step_definitions";

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

Then('the first {string} fragment is immutable', (view: string) => {
    obtainRootFragment('mobility-hindrances', view)
        .then(fragment => waitForFragment(fragment, x => x.immutable, 'be immutable').then(() => firstFragment = fragment));
})

Then('the first fragment only has a {string} to the middle fragment', (type: string) => {
    firstFragment.expectNoOtherRelationThan(type);
    middleFragment = new Fragment(firstFragment.expectSingleRelationOf(type).link);
})

Then('the middle fragment is immutable', () => {
    waitForFragment(middleFragment, x => x.immutable, 'be immutable')
})

Then('the middle fragment only has a {string} to the last fragments', (type: string) => {
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

Then('the last fragment has no relations', () => {
    expect(lastFragment.relations.length).to.equal(0);
})

Then('the substring root fragment contains {string} relations with values: {string} and is mutable', (relationType: string, relationValues: string) => {
    obtainRootFragment('addresses', 'by-name').then(fragment => {
        const values = relationValues.split(',');
        const expectedCount = values.length;

        ensureRelationCount(fragment, expectedCount).then(() => {
            const relations = fragment.expectMultipleRelationOf(relationType, expectedCount);
            values.forEach(value => {
                const relation = relations.filter(x => x.value === value).shift();
                expect(relation).not.to.be.undefined;
                expect(relation?.path).to.equal('https://data.vlaanderen.be/ns/adres#volledigAdres');
                expect(relation?.link).to.equal(`${rootFragment.url}${value}`);
            });
        }).then(() => fragment.expectMutable());
    })
});

Then('the fragment exists for substring {string}', (fragmentValues: string) => {
    const values = fragmentValues.split(',');
    values.forEach(value => {
        waitForFragment(new Fragment(`${rootFragment.url}${value}`), x => x.success, 'to exist');
    });
})

Then('the multi-view root fragment is not immutable', () => {
    server.checkRootFragmentMutable(mobilityHindrancesLdes, byTime).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} contains the member', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${mobilityHindrancesLdes}/${byLocation}?tile=${tile}`;
    const relation = relations.find(x => x.link === relationUrl);
    expect(relation).not.to.be.undefined;
    const memberId = 'https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10496796/1192116';

    waitForFragment(new Fragment(relationUrl), x => x.hasSingleRelationLink, 'have a single relation link')
        .then(fragment => waitForFragment(new Fragment(fragment.relation.link), x => x.members.map(m => m.id).includes(memberId), `include member '${memberId}'`));
})

Then('the multi-view root fragment contains multiple relations of type {string}', (relationType: string) => {
    const expectedCount = 4;
    ensureRelationCount(rootFragment, expectedCount).then(() => {
        relations = rootFragment.expectMultipleRelationOf(relationType, expectedCount);
    });
})


function fragmentationRootExists(ldes: string, view: string) {
    return obtainRootFragment(ldes, view)
        .then(fragment => {
            expect(fragment.url).not.to.be.undefined;
            return waitForFragment(fragment, x => x.success, 'to exist');
        });
}

Then('the geo-spatial fragmentation exists in the connections LDES', () => {
    fragmentationRootExists(connectionsLdes, byLocationAndPage).then(fragment => rootFragment = fragment);
})

Then('the mobility-hindrances LDES is geo-spatially fragmented', () => {
    fragmentationRootExists(mobilityHindrancesLdes, byLocation).then(fragment => rootFragment = fragment);
})

Then('the mobility-hindrances LDES is paginated', () => {
    fragmentationRootExists(mobilityHindrancesLdes, byPage).then(fragment => rootFragment = fragment);
})

Then('the connections LDES is paginated', () => {
    fragmentationRootExists(connectionsLdes, byPage).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} is sub-fragmented using pagination which contains the members', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${mobilityHindrancesLdes}/${byLocationAndPage}?tile=${tile}`;
    const relation = relations.find(x => x.link === relationUrl);
    expect(relation).not.to.be.undefined;

    waitForFragment(new Fragment(relationUrl), x => x.hasSingleRelationLink, 'have a single relation')
        .then(fragment => waitForFragment(new Fragment(fragment.relation.link), x => x.memberCount === 5, 'have 5 members'))
        .then(fragment => waitForFragment(new Fragment(fragment.relation.link), x => x.memberCount === 1, 'have 1 member'))
})

Then('the {string} root fragment contains {int} relations of type {string} and is mutable', (view: string, amount: number, relationType: string) => {
    obtainRootFragment(mobilityHindrancesLdes, view).then(fragment => {
        ensureRelationCount(fragment, amount).then(() => {
            fragment.expectMutable();
            relations = fragment.expectMultipleRelationOf(relationType, amount);
        });
    })
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
    waitForFragment(rootFragment, x => x.memberCount === count, `have member count equal ${count}`);
})

Then('the last fragment contains {int} members', (count: number) => {
    waitForFragment(lastFragment, x => x.memberCount === count, `have member count equal ${count}`);
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

    waitForFragment(new Fragment(url), x => x.relations.length === count, `have ${count} relations`).then(fragment => {
        paginationFragment = fragment;
        expect(fragment.relations.length).to.equal(count);
        expect(fragment.expectNoOtherRelationThan(type));
    })
})

Then('all members contains arrival and departure stops', () => {
    const members = paginationFragment.members;
    members.forEach(member => {
        expect(member.arrivalStop).not.to.be.undefined;
        expect(member.departureStop).not.to.be.undefined;
    });
})
