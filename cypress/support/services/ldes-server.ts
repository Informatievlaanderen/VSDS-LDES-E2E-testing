/// <reference types="cypress" />

import { checkSuccess, timeouts } from '../common';
import { EventStream, Fragment } from '../ldes';
import { CanCheckAvailability } from './interfaces';

export class LdesServer implements CanCheckAvailability {
    public static ApplicationStarted = 'Started Application in';

    constructor(public baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldes-server';
    }

    private isReady() {
        return cy.request({ url: `${this.baseUrl}/actuator/health`, failOnStatusCode: false }).then(response => response.isOkStatusCode);
    }

    waitAvailable() {
        return cy.waitUntil(() => this.isReady(), {
            timeout: timeouts.slowAction,
            interval: timeouts.slowCheck, errorMsg:
                `Timed out waiting for container '${this.serviceName}' to be available`
        }).then(() => this);
    }

    getLdes(collection: string) {
        return new EventStream(`${this.baseUrl}/${collection}`).visit();
    }

    sendMemberFile(collection: string, partialFilePath: string, mimeType: string) {
        return cy.readFile(partialFilePath, 'utf8').then(data =>
            cy.request({
                method: 'POST',
                url: `${this.baseUrl}/${collection}`,
                headers: { 'Content-Type': mimeType },
                body: data
            }));
    }

    checkRootFragmentMutable(ldes: string, view: string) {
        return this.getLdes(ldes)
            .then(ldes => new Fragment(ldes.viewUrl(view)).visit())
            .then(view => new Fragment(view.relation.link).visit())
            .then(fragment => fragment.expectMutable());
    }

    createSnapshot(collection: string) {
        return cy.request({ method: 'POST', url: `${this.baseUrl}/admin/api/v1/${collection}/snapshots` });
    }

    sendConfiguration(testPartialPath: string): any {
        const cmd = `sh ${testPartialPath}/server/seed.sh`;
        cy.log(cmd).exec(cmd, { log: true, failOnNonZeroExit: false })
            .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
    }

    configureLdesFromTurtleContent(body: string) {
        cy.request({
            method: 'POST',
            url: `${this.baseUrl}/admin/api/v1/eventstreams`,
            headers: { 'Content-Type': 'text/turtle' },
            body: body,
        }).then(response => { expect(response.status).to.equal(201); });
    }

    configureViewFromTurtleContent(body: string, collection: string) {
        cy.request({
            method: 'POST',
            url: `${this.baseUrl}/admin/api/v1/eventstreams/${collection}/views`,
            headers: { 'Content-Type': 'text/turtle' },
            body: body,
        }).then(response => { expect(response.status).to.equal(201); });
    }

    removeView(collection: string, view: string) {
        cy.request({
            method: 'DELETE',
            url: `${this.baseUrl}/admin/api/v1/eventstreams/${collection}/views/${view}`,
        }).then(response => { expect(response.status).to.equal(200); });
    }

}
