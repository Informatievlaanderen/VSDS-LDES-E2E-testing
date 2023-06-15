/// <reference types="cypress" />

import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { EventStream, Fragment } from '../ldes';
import { server, testPartialPath, range } from "./common_step_definitions";

let ldes: EventStream;
let view: Fragment;
let execResult: string;

// When

When('I request the view formatted as {string}', (mimeType: string) => {
    return new Fragment(`${server.baseUrl}/mobility-hindrances/by-time`).visit({ mimeType: mimeType }).then(page => {
        expect(page.success).to.be.true;
        view = page;
    })
})

When('I request the view from a different url {string}', (url: string) => {
    const command = `curl -i -X OPTIONS -H "Origin: ${url}" -H "Access-Control-Request-Method: GET" http://localhost:8080/mobility-hindrances/by-time`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

When('I only request the view headers', () => {
    const command = `curl --head http://localhost:8080/mobility-hindrances/by-time`
    return cy.exec(command).then(result => execResult = result.stdout);
})

When('I request the LDES', () => {
    const command = `curl -i http://localhost:8080/mobility-hindrances`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

When('I request the view compressed', () => {
    const command = `curl -I -H "Accept-Encoding: gzip" http://localhost:8080/mobility-hindrances/by-time`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

When('I request the LDES view', () => {
    const command = `curl -i http://localhost:8080/mobility-hindrances/by-time`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

When('I send the member file {string} of type {string}', (fileName: string, mimeType: string) => {
    return server.sendMemberFile('mobility-hindrances', `${testPartialPath()}/${fileName}`, mimeType)
        .then(result => {
            expect(result.code).to.equal(0);
            execResult = result.stdout;
        })
})

When('I wait {int} seconds for the cache to expire', (timeout: number) => {
    cy.wait((timeout + 1) * 1000);
})

When('I ingest {int} {string}', (count:number, memberType: string) => {
    range(1, count).forEach(member => {
        const command = `curl -i -X POST --url "http://localhost:8080/${memberType}" -H "Content-Type: text/turtle" --data-binary "@${testPartialPath()}/data/${memberType}${member}.ttl"`;
        cy.log(command).then(() => cy.exec(command));
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

Then('the server returns the supported HTTP Verbs', () => {
    expect(execResult).to.include('Access-Control-Allow-Origin: *').and.to.include('Access-Control-Allow-Methods: GET').and.to.include('Allow: GET, HEAD');
})

Then('the headers include an Etag which is used for caching purposes', () => {
    expect(execResult).to.include('ETag:');
})

Then('the LDES is not yet cached', () => {
    expect(execResult).to.include('X-Cache-Status: MISS');
})

Then('the LDES comes from the cache', () => {
    expect(execResult).to.include('X-Cache-Status: HIT');
})

Then('I receive a zip file containing my view', () => {
    expect(execResult).to.include('Content-Encoding: gzip');
})

Then('the LDES is re-requested from the LDES server', () => {
    expect(execResult).to.include('X-Cache-Status: EXPIRED');
})

Then('the server accepts this member file', () => {
    expect(execResult).to.include('HTTP/1.1 200').and.to.include('Server: nginx');
})

function obtainRootFragment(ldes: string) {
    return server.getLdes(ldes)
        .then(ldes => new Fragment(ldes.viewUrl('paged')).visit())
        .then(view => new Fragment(view.relation.link).visit());
}

Then('the {string} root fragment contains {int} members', (ldes: string, count: number) => {
    obtainRootFragment(ldes).then(fragment => fragment.memberCount === count);
})

Then('the {string} root fragment contains at least {int} members', (ldes: string, count: number) => {
    obtainRootFragment(ldes).then(fragment => fragment.memberCount >= count);
})

Then('the {string} LDES contains {int} members', (collection: string, count: number) => {
    new Fragment(`http://localhost:8080/${collection}/by-page?pageNumber=1`).visit()
        .then(fragment => expect(fragment.memberCount).to.equal(count));
})

interface CollectionSequence {
    collection: string;
    sequence: number
};

Then('all {int} {string} have a unique sequence number', (count: number, collection: string) => {
    cy.request("http://localhost:9019/test/member_sequence?includeDocuments=true").then(response => {
        const result = response.body;
        expect(result.count).to.be.equal(2);
        expect(result.documents).to.deep.include({ _id: collection, seq: count });
    });

    const expected = new Array(count).fill(1).map((_, i) => ({ collection: collection, sequence: i + 1 }));
    const command = `curl -s "http://localhost:9019/test/ldesmember?includeDocuments=true" | jq "[.documents[] | {collection: .collectionName, sequence: .sequenceNr}]"`;
    cy.exec(command, { failOnNonZeroExit: false }).then(result => {
        const collectionSequences = JSON.parse(result.stdout) as CollectionSequence[];
        const actual = collectionSequences.filter(x => x.collection === collection);
        expect(actual).to.eql(expected);
    });
})
