/// <reference types="cypress" />
import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesServer } from "..";
import { Fragment } from '../ldes';

const server = new LdesServer('http://localhost:8080');

let firstFragment: Fragment;
let middleFragment: Fragment;
let lastFragment: Fragment;

Then('the first fragment is immutable', () => {
    server.waitAvailable().then(() =>
        server.getLdes('mobility-hindrances')
            .then(ldes => new Fragment(ldes.viewUrl).visit())
            .then(view => new Fragment(view.relation.link).visit())
            .then(fragment => {
                firstFragment = fragment;
                firstFragment.expectImmutable();
            })
    );
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

    const urls = middleFragment.expectMultipleRelationOf(type, 2).map(x => x.link);
    expect(urls).to.contain(firstFragment.url);

    const other = urls.find(x => x !== firstFragment.url);
    expect(other).not.to.be.undefined;

    // cast is safe as expect guards that other is not undefined
    new Fragment(other as string).visit().then(fragment => lastFragment = fragment);
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
