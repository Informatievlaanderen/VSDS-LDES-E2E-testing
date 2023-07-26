/// <reference types="cypress" />

import { checkSuccess, timeouts } from '../common';
import { EventStream, Fragment } from '../ldes';
import { CanCheckAvailability } from './interfaces';

export class LdesServer implements CanCheckAvailability {
    public static ApplicationStarted = 'Started Application in';
    public static DatabaseUpgradeFinished = 'Cancelled mongock lock daemon';

    constructor(public baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldes-server';
    }

    private isReady(containerId: string, message?: string, minOccurences: number = 1 ) {
        return cy.exec(`docker logs ${containerId}`)
            .then(result => {
                const regex = new RegExp(message || LdesServer.DatabaseUpgradeFinished, "g");
                return (result.stdout.match(regex) || []).length >= minOccurences;
            });
    }

    waitAvailable(message?: string, minOccurences: number = 1) {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(containerId, message, minOccurences), { timeout: timeouts.slowAction, interval: timeouts.slowCheck }).then(() => this);
            });
    }

    getLdes(collection: string) {
        return new EventStream(`${this.baseUrl}/${collection}`).visit();
    }

    sendMemberFile(collection: string, partialFilePath: string, mimeType: string) {
        return cy.readFile(partialFilePath, 'utf8').then(data => 
            cy.request({
                method: 'POST', 
                url: `${this.baseUrl}/${collection}`, 
                headers: { 'Content-Type': mimeType}, 
                body: data
            }));
    }

    checkRootFragmentMutable(ldes: string, view: string) {
        return this.getLdes(ldes)
            .then(ldes => new Fragment(ldes.viewUrl(view)).visit())
            .then(view => new Fragment(view.relation.link).visit())
            .then(fragment => fragment.expectMutable());
    }

    expectViewUrlNotToBeUndefined(ldes: string, viewName: string) {
        return this.getLdes(ldes)
            .then(ldes => new Fragment(ldes.getViews(viewName)).visit())
            .then(view => view.relation.link)
            .then(url => {
                expect(url).not.to.be.undefined;
                return new Fragment(url).visit();
            });
    }

    createSnapshot(collection: string) {
        return cy.request({method: 'POST', url: `${this.baseUrl}/admin/api/v1/${collection}/snapshots`});
    }

    sendConfiguration(testPartialPath: string, configFileName?: string): any {
        const cmd = `sh ${testPartialPath}/config/${configFileName || 'seed.sh'}`;
        cy.log(cmd).exec(cmd, { log: true, failOnNonZeroExit: false })
            .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
    }

    configureLdesFromTurtleContent(body: string) {
        cy.request({
            method: 'POST', 
            url: `${this.baseUrl}/admin/api/v1/eventstreams`, 
            headers: {'Content-Type': 'text/turtle'},
            body: body, 
        }).then(response => {expect(response.status).to.equal(201);});
    }

    configureViewFromTurtleContent(body: string, collection: string) {
        cy.request({
            method: 'POST', 
            url: `${this.baseUrl}/admin/api/v1/eventstreams/${collection}/views`, 
            headers: {'Content-Type': 'text/turtle'},
            body: body, 
        }).then(response => {expect(response.status).to.equal(201);});
    }

    removeView(collection: string, view: string) {
        cy.request({
            method: 'DELETE', 
            url: `${this.baseUrl}/admin/api/v1/eventstreams/${collection}/views/${view}`, 
        }).then(response => {expect(response.status).to.equal(200);});
    }

}
