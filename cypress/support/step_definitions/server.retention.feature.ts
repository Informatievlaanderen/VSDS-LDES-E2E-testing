/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment } from '../ldes';
import { server } from "./common_step_definitions";

const fragments: { [key: string]: Fragment } = {};

// Given

Given('I configure the LDES server for the retention test-012', () => {
    cy.fixture('test-012/mobility-hindrances.ttl').then((body: string) => server.configureLdesFromTurtleContent(body));
    cy.fixture('test-012/mobility-hindrances.by-short-time.ttl').then((body: string) => server.configureViewFromTurtleContent(body, 'mobility-hindrances'));
    cy.fixture('test-012/mobility-hindrances.by-longer-time.ttl').then((body: string) => server.configureViewFromTurtleContent(body, 'mobility-hindrances'));
})

// When

When('fragment {string} is deleted and returns HTTP code {int}', (fragmentAlias: string, httpCode: number) => {
    fragments[fragmentAlias].waitForResponseCode(httpCode);
})

When('I refresh view {string}', (viewAlias: string) => {
    fragments[viewAlias].refresh();
})


// Then

Then('the LDES has a view {string} named {string}', (viewAlias: string, viewName: string) => {
    server.getLdes('mobility-hindrances')
        .then(ldes => ldes.viewUrl(viewName))
        .then(url => {
            expect(url).not.be.be.undefined;
            return new Fragment(url).visit();
        })
        .then(view => fragments[viewAlias] = view);
})

function verifyLinksToFragment(fromAlias: string, relationType: string, mutability: string, toAlias: string, memberCount: number) {
    const isMutable = mutability === 'mutable';
    const isImmutable = mutability === 'immutable';
    if (!isMutable && !isImmutable) throw new Error(`Unknown immutability: ${mutability}`);

    const from = fragments[fromAlias];
    const relation = from.expectSingleRelationOf(relationType);
    new Fragment(relation.link).visit()
        .then(fragment => fragments[toAlias] = fragment)
        .then(fragment => {
            if (isImmutable) fragment.expectImmutable();
            if (isMutable) fragment.expectMutable();
            expect(fragment.memberCount).to.equal(memberCount);
        });
}

Then('view {string} links to {string} fragment {string} containing {int} members',
    (viewAlias: string, mutability: string, fragmentAlias: string, memberCount: number) => {
        verifyLinksToFragment(viewAlias, 'Relation', mutability, fragmentAlias, memberCount)
    });

Then('fragment {string} links to {string} fragment {string} containing {int} members',
    (fromAlias: string, mutability: string, toAlias: string, memberCount: number) => {
        verifyLinksToFragment(fromAlias, 'GreaterThanOrEqualToRelation', mutability, toAlias, memberCount)
    });

