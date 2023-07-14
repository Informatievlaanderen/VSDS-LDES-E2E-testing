/// <reference types="cypress" />

import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { EventStream, Fragment } from '../ldes';
import { server, testPartialPath, range, mongo, testDatabase } from "./common_step_definitions";

let ldes: EventStream;
let view: Fragment;

let sendMemberResponse: Cypress.Response<any>;
let corsResponse: Cypress.Response<any>;
let headResponse: Cypress.Response<any>;
let ldesResponse: Cypress.Response<any>;
let viewResponse: Cypress.Response<any>;
let compressedViewResponse: Cypress.Response<any>;

// When

When('I request the view formatted as {string}', (mimeType: string) => {
    return new Fragment(`${server.baseUrl}/mobility-hindrances/by-time`).visit({ mimeType: mimeType }).then(page => {
        expect(page.success).to.be.true;
        view = page;
    });
})

When('I request the view from a different url {string}', (url: string) => {
    return cy.request({
        method: 'OPTIONS',
        headers: {
            'Origin': url,
            'Access-Control-Request-Method': 'GET',
        },
        url: `${server.baseUrl}/mobility-hindrances/by-time`,
    }).then(response => corsResponse = response);
})

When('I only request the view headers', () => {
    return cy.request({
        method: 'HEAD',
        url: `${server.baseUrl}/mobility-hindrances/by-time`
    }).then(response => headResponse = response);
})

When('I request the LDES', () => {
    return cy.request(`${server.baseUrl}/mobility-hindrances`).then(response => ldesResponse = response);
})

When('I request the view compressed', () => {
    return cy.request({
        method: 'HEAD',
        headers: {
            'Accept-Encoding': 'gzip'
        },
        url: `${server.baseUrl}/mobility-hindrances/by-time`,
    }).then(response => compressedViewResponse = response);
})

When('I request the LDES view', () => {
    return cy.request(`${server.baseUrl}/mobility-hindrances/by-time`).then(response => viewResponse = response);
})

When('I send the member file {string} of type {string}', (fileName: string, mimeType: string) => {
    return server.sendMemberFile('mobility-hindrances', `${testPartialPath()}/${fileName}`, mimeType).then(response => sendMemberResponse = response);
})

When('I wait {int} seconds for the cache to expire', (timeout: number) => {
    cy.wait((timeout + 1) * 1000);
})

When('I ingest {int} {string}', (count:number, memberType: string) => {
    range(1, count).forEach(member => {
        cy.readFile(`${testPartialPath()}/data/${memberType}${member}.ttl`, 'utf8').then(data => 
            cy.request({
                method: 'POST',
                url: `${server.baseUrl}/${memberType}`,
                headers: { 'Content-Type': 'text/turtle' },
                body: data,
            }).then(response => expect(response.status).to.equal(200))
        );
    });
})

// Then

Then('the collection is available at {string}', (url: string) => {
    new EventStream(url).visit().then(page => {
        expect(page.success).to.be.true;
        expect(page.isEventStream).to.be.true;
        ldes = page;
    });
})

Then('the view is available at {string}', (url: string) => {
    new Fragment(url).visit().then(page => {
        expect(page.success).to.be.true;
        expect(page.isNode).to.be.true;
        expect(page.isViewOf(ldes.url)).to.be.true;
    });
})

When('I configure a LDES named {string}', (collectionName: string) => {
    cy.fixture('test-019/templates/ldes.ttl').then((content: string) => 
        server.configureLdesFromTurtleContent(content.replace('{collectionName}', collectionName)));
})

When('I configure a view named {string} for LDES {string}', (viewName: string, collectionName: string) => {
    cy.fixture('test-019/templates/view.ttl').then((content: string) => 
        server.configureViewFromTurtleContent(content.replace('{collectionName}', collectionName).replace('{viewName}', viewName), collectionName));
})

Then('I receive a response similar to {string}', (fileName: string) => {
    cy.fixture(`test-019/responses/${fileName}`).then((content: string | object) => view.expectContent(content));
})

Then('the first page is a subset of the collection', () => {
    new Fragment(view.relation.link).visit()
        .then(fragment => expect(fragment.isPartOf(`${server.baseUrl}/mobility-hindrances`)).true);
})

Then('the server returns the supported HTTP Verbs', () => {
    const headers = corsResponse.headers;
    expect(headers['access-control-allow-origin']).to.equal('*');
    expect(headers['access-control-allow-methods']).to.equal('GET');
    expect(headers.allow).to.contain('GET, HEAD');
})

Then('the headers include an Etag which is used for caching purposes', () => {
    expect(headResponse.headers.etag).to.not.be.undefined;
})

Then('the LDES is not yet cached', () => {
    expect(ldesResponse.headers['x-cache-status']).to.equal('MISS');
})

Then('the LDES view is not yet cached', () => {
    expect(viewResponse.headers['x-cache-status']).to.equal('MISS');
})

Then('the LDES comes from the cache', () => {
    expect(ldesResponse.headers['x-cache-status']).to.equal('HIT');
})

Then('the LDES view comes from the cache', () => {
    expect(viewResponse.headers['x-cache-status']).to.equal('HIT');
})

Then('I receive a zip file containing my view', () => {
    expect(compressedViewResponse.headers['content-encoding']).to.equal('gzip');
})

Then('the LDES view is re-requested from the LDES server', () => {
    expect(viewResponse.headers['x-cache-status']).to.equal('EXPIRED');
})

Then('the server accepts this member file', () => {
    expect(sendMemberResponse.status).to.equal(200)
    expect(sendMemberResponse.headers.server).to.contain('nginx');
})

function obtainRootFragment(ldes: string, view="paged") {
    return server.getLdes(ldes)
        .then(ldes => new Fragment(ldes.viewUrl(view)).visit())
        .then(view => new Fragment(view.relation.link).visit());
}

Then('the {string} {string} fragment contains {int} members', (ldes: string, view: string, count: number) => {
    obtainRootFragment(ldes, view).then(fragment => fragment.memberCount === count);
})

Then('the {string} root fragment contains {int} members', (ldes: string, count: number) => {
    obtainRootFragment(ldes).then(fragment => fragment.memberCount === count);
})

Then('the {string} {string} fragment contains at least {int} members', (ldes: string, view: string, count: number) => {
    obtainRootFragment(ldes, view).then(fragment => fragment.memberCount >= count);
})

Then('the {string} root fragment contains at least {int} members', (ldes: string, count: number) => {
    obtainRootFragment(ldes).then(fragment => fragment.memberCount >= count);
})

Then('the {string} LDES contains {int} members', (collection: string, count: number) => {
    new Fragment(`${server.baseUrl}/${collection}/by-page?pageNumber=1`).visit()
        .then(fragment => expect(fragment.memberCount).to.equal(count));
})

interface CollectionSequence {
    collection: string;
    sequence: number
};

Then('all {int} {string} have a unique sequence number', (count: number, collection: string) => {
    cy.request(`${mongo.baseUrl}/${testDatabase()}/member_sequence?includeDocuments=true`).then(response => {
        const result = response.body;
        expect(result.count).to.be.equal(2);
        expect(result.documents).to.deep.include({ _id: collection, seq: count });
    });

    const expected = new Array(count).fill(1).map((_, i) => ({ collection: collection, sequence: i + 1 }));
    cy.request(`${mongo.baseUrl}/${testDatabase()}/ldesmember?includeDocuments=true`).then(response => {
        const result = response.body;
        const collectionSequences = result.documents.map(x => ({ collection: x.collectionName, sequence: x.sequenceNr })) as CollectionSequence[];
        const actual = collectionSequences.filter(x => x.collection === collection);
        expect(actual).to.eql(expected);
    });
})
