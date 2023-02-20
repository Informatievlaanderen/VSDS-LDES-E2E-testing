/// <reference types="cypress" />

import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { EventStream, Fragment } from '../ldes';
import { server } from "./common_step_definitions";

let ldes: EventStream;
let view: Fragment;

Then('the collection is available at {string}', (url: string) => {
    server.waitAvailable();
    
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
    server.waitAvailable().then(() => 
        new Fragment(`${server.baseUrl}/mobility-hindrances/by-time`).visit(mimeType).then(page => {
            expect(page.success).to.be.true;
            view = page;
        })
    );
})

Then('I receive a response similar to {string}', (fileName: string) => {
    cy.fixture(`ldes-server-caching/${fileName}`).then((content: string) => {
        view.expectContent(content);
    });
})
