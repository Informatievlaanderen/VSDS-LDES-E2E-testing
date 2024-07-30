/// <reference types="cypress" />

import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment } from '../ldes';
import { server, waitForFragment, obtainRootFragment, byPage, obtainViewWithDefaultFragment, createAndStartService } from "./common_step_definitions";
import {Gtfs2Ldes} from "../services/gtfs2ldes";

let ldesResponse: Cypress.Response<any>;
let viewResponse: Cypress.Response<any>;
let compressedViewResponse: Cypress.Response<any>;

export const gtfs2ldes = new Gtfs2Ldes();

const parkAndRideLdes = 'occupancy';

// Given

Given('I configure the GTFS2LDES service in context {string}', (path: string) => {
    const cmd = `cp ${path}/config/gtfs2ldes.config.json ${path}/gtfs/config.json && chmod 0777 ${path}/gtfs/config.json`
    return cy.exec(cmd, {log: true});
})

// When

When('I request the LDES', () => {
    return cy.request(`${server.baseUrl}/${parkAndRideLdes}`).then(response => ldesResponse = response);
})

When('I request the view compressed', () => {
    return cy.request({
        method: 'HEAD',
        headers: {
            'Accept-Encoding': 'gzip'
        },
        url: `${server.baseUrl}/${parkAndRideLdes}/${byPage}`,
    }).then(response => compressedViewResponse = response);
})

When('I request the LDES view', () => {
    return cy.request(`${server.baseUrl}/${parkAndRideLdes}/${byPage}`).then(response => viewResponse = response);
})

When('I wait {int} seconds for the cache to expire', (timeout: number) => {
    cy.wait((timeout + 1) * 1000);
})

When('I start the GTFS2LDES service', () => {
    createAndStartService(gtfs2ldes.serviceName).then(() => gtfs2ldes.waitAvailable());
})

When('the GTFS to LDES service starts sending linked connections', () => {
    gtfs2ldes.waitSendingLinkedConnections();
})

// Then

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

Then('the {string} {string} fragment contains {int} members', (ldes: string, view: string, count: number) => {
    obtainRootFragment(ldes, view).then(fragment => waitForFragment(fragment, x => x.memberCount === count, `have member count equal ${count}`));
})

Then('the {string} root fragment contains {int} members', (ldes: string, count: number) => {
    obtainRootFragment(ldes, byPage).then(fragment => waitForFragment(fragment, x => x.memberCount === count, `have member count equal ${count}`));
})

Then('the {string} {string} fragment contains at least {int} members', (ldes: string, view: string, count: number) => {
    obtainRootFragment(ldes, view).then(fragment => waitForFragment(fragment, x => x.memberCount >= count, `have member count be at least ${count}`));
})

Then('the {string} root fragment contains at least {int} members', (ldes: string, count: number) => {
    obtainRootFragment(ldes, byPage).then(fragment => waitForFragment(fragment, x => x.memberCount >= count, `have member count be at least ${count}`));
})

Then('the {string} LDES contains {int} members', (collection: string, count: number) => {
    new Fragment(`${server.baseUrl}/${collection}/${byPage}?pageNumber=1`).visit().then(fragment => waitForFragment(fragment, x => x.memberCount === count, `have member count equal ${count}`));
})

let rootFragment: Fragment;
const connectionsLdes = 'connections';

function fragmentationRootExists(ldes: string, view: string) {
    return obtainRootFragment(ldes, view)
        .then(fragment => {
            expect(fragment.url).not.to.be.undefined;
            return waitForFragment(fragment, x => x.success, 'to exist');
        });
}

Then('the connections LDES is paginated', () => {
    fragmentationRootExists(connectionsLdes, byPage).then(fragment => rootFragment = fragment);
})

Then('the first page contains {int} members', (count: number) => {
    waitForFragment(rootFragment, x => x.memberCount === count, `have member count equal ${count}`);
})

Then('the {string} view has a relation to the default fragment', (view: string) => {
    obtainViewWithDefaultFragment("mobility-hindrances", view);
})
