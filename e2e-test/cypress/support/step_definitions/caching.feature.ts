/// <reference types="cypress" />
import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { EventStream, Fragment } from '../ldes';
import { LdesServer } from "../services";

const server = new LdesServer('http://localhost:8080');

let ldes: EventStream;

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