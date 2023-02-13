/// <reference types="cypress" />
import * as N3 from 'n3';
import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { LdesServer } from "..";

const server = new LdesServer('http://localhost:8080');

let quads: N3.Store;
let firstFragmentUrl: string;
let middleFragmentUrl: string;
let lastFragmentUrl: string;

Then('the first fragment is immutable', () => {
    server.getFirstFragmentUrl().then(url => {
        firstFragmentUrl = url;
        return cy.request(url).then(response => {
            server.expectMutableFragment(response, true);
            return server.parseQuads(response);
        }).then(x => quads = x);
    });
})

Then('the first fragment only has a {string} to the middle fragment', (relationType: string) => {
    middleFragmentUrl = server.expectOneRelation(quads, server.treePrefix + relationType);
})

Then('the middle fragment is immutable', () => {
    cy.request(middleFragmentUrl).then(response => {
        server.expectMutableFragment(response, true);
        return server.parseQuads(response);
    }).then(x => quads = x);
})

Then('the middle fragment only has a {string} to the first and last fragments', (relationType: string) => {
    const urls = server.expectRelationCount(quads, server.treePrefix + relationType, 2);
    expect(urls).to.contain(firstFragmentUrl);
    const other = urls.find(x => x !== firstFragmentUrl);
    expect(other).not.to.be.undefined;
    lastFragmentUrl = other as string; // cast is safe as expect guards that other is not undefined
})

Then('the middle fragment only has a {string} to the first fragment', (relationType: string) => {
    const url = server.expectOneRelation(quads, server.treePrefix + relationType);
    expect(url).to.equal(firstFragmentUrl);
})

Then('the middle fragment only has a {string} to the last fragment', (relationType: string) => {
    lastFragmentUrl = server.expectOneRelation(quads, server.treePrefix + relationType);
})

Then('the last fragment is not immutable', () => {
    cy.request(lastFragmentUrl).then(response => {
        server.expectMutableFragment(response, false);
        return server.parseQuads(response);
    }).then(x => quads = x);
})

Then('the last fragment only has a {string} to the middle fragment', (relationType: string) => {
    const url = server.expectOneRelation(quads, server.treePrefix + relationType);
    expect(url).to.equals(middleFragmentUrl);
})
