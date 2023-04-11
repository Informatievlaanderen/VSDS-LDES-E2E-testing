/// <reference types="cypress" />
import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment } from '../ldes';
import { ensureRelationCount, server } from "./common_step_definitions";

let rootFragment: Fragment;

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
            expect(relation.path).to.equal('https://data.vlaanderen.be/ns/adres#volledigAdres');
            expect(relation.link).to.equal(`${rootFragment.url}${value}`);
        });
    });
});

Then('the fragment exists for substring {string}', (fragmentValues: string) => {
    const values = fragmentValues.split(',');
    values.forEach(value => {
        new Fragment(`${rootFragment.url}${value}`).visit().then(fragment => expect(fragment.success).to.be.true);
    });
})
