/// <reference types="cypress" />
import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesServer } from "..";
import { Fragment } from '../ldes';

const server = new LdesServer('http://localhost:8080');
let rootFragment: Fragment;

Then('the root fragment is not immutable', () => {
    server.waitAvailable();
    server.getLdes('addresses')
        .then(ldes => new Fragment(ldes.viewUrl('by-name')).visit())
        .then(view => new Fragment(view.relation.link).visit())
        .then(fragment => {
            rootFragment = fragment;
            rootFragment.expectMutable();
        });
})

Then('the root fragment contains {string} relations with values: {string}', (relationType: string, relationValues: string) => {
    rootFragment.expectMutable();

    let values = relationValues.split(',');
    const relations = rootFragment.expectMultipleRelationOf(relationType, values.length);

    values.forEach(value => {
        const relation = relations.filter(x => x.value === value).shift();
        expect(relation).not.to.be.undefined;
        expect(relation.path).to.equal('https://data.vlaanderen.be/ns/adres#volledigAdres');
        expect(relation.link).to.equal(`${rootFragment.url}${value}`);
    });
});

Then('the fragment exists for substring {string}', (fragmentValues: string) => {
    let values = fragmentValues.split(',');
    values.forEach(value => {
        new Fragment(`${rootFragment.url}${value}`).visit().then(fragment => expect(fragment.success).to.be.true);
    });
})
