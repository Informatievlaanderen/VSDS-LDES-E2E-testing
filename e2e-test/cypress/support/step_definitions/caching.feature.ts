/// <reference types="cypress" />

import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { EventStream, Fragment } from '../ldes';
import { server, testPartialPath } from "./common_step_definitions";

let ldes: EventStream;
let view: Fragment;
let execResult: string;

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

When('I request the view formatted as {string}', (mimeType: string) => {
    return new Fragment(`${server.baseUrl}/mobility-hindrances/by-time`).visit(mimeType).then(page => {
        expect(page.success).to.be.true;
        view = page;
    })
})

Then('I receive a response similar to {string}', (fileName: string) => {
    cy.fixture(`ldes-server-caching/${fileName}`).then((content: string | object) => {
        view.expectContent(content);
    });
})

When('I send the member file {string} of type {string}', (fileName: string, mimeType: string) => {
    return server.sendMemberFile('mobility-hindrances', `${testPartialPath()}/${fileName}`, mimeType)
        .then(result => {
            expect(result.code).to.equal(0);
            execResult = result.stdout;
        })
})

Then('the server accepts this member file', () => {
    expect(execResult).to.include('HTTP/1.1 200').and.to.include('Server: nginx');
})

When('I request the view from a different url {string}', (url: string) => {
    const command = `curl -i -X OPTIONS -H "Origin: ${url}" -H "Access-Control-Request-Method: GET" http://localhost:8080/mobility-hindrances/by-time`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

Then('the server returns the supported HTTP Verbs', () => {
    expect(execResult).to.include('Access-Control-Allow-Origin: *').and.to.include('Access-Control-Allow-Methods: GET').and.to.include('Allow: GET, HEAD');
})

When('I only request the view headers', () => {
    const command = `curl --head http://localhost:8080/mobility-hindrances/by-time`
    return cy.exec(command).then(result => execResult = result.stdout);
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

When('I request the LDES', () => {
    const command = `curl -i http://localhost:8080/mobility-hindrances`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

When('I request the view compressed', () => {
    const command = `curl -I -H "Accept-Encoding: gzip" http://localhost:8080/mobility-hindrances/by-time`;
    return cy.exec(command).then(result => execResult = result.stdout);
})

Then('I receive a zip file containing my view', () => {
    expect(execResult).to.include('Content-Encoding: gzip');
})
