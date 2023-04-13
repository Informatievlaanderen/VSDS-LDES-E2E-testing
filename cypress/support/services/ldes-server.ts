/// <reference types="cypress" />

import { EventStream, Fragment } from '../ldes';
import { CanCheckAvailability } from './interfaces';

export class LdesServer implements CanCheckAvailability {

    constructor(public baseUrl: string, private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldes-server';
    }

    private isReady(containerId: string, message?: string) {
        return cy.exec(`docker logs ${containerId}`)
            .then(result => result.stdout.includes(message || "Started Application in"));
            //.then(result => result.stdout.includes(message || "Mongock has finished"));
    }

    waitAvailable(message?: string) {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(containerId, message), { timeout: 120000, interval: 5000 });
            });
    }

    getLdes(collection: string) {
        return new EventStream(`${this.baseUrl}/${collection}`).visit();
    }

    sendMemberFile(collection: string, partialFilePath: string, mimeType: string) {
        const command = `curl -i -X POST "${this.baseUrl}/${collection}" -H "Content-Type: ${mimeType}" -d "@${partialFilePath}"`;
        return cy.log(command).then(() => cy.exec(command));
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

}
