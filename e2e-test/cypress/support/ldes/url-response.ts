/// <reference types="cypress" />
import N3 = require('n3');

export abstract class UrlResponse {
    private _response: Cypress.Response<any>;

    protected parser = new N3.Parser({ format: 'text/turtle' });
    protected store: N3.Store | undefined;
    
    constructor(public url: string) { }

    visit() {
        return cy.request(this.url)
            .then(response => {
                this._response = response;
                return response.body;
            })
            .then(body => {
                const quads = this.parser.parse(body);
                this.store = new N3.Store(quads);
                return this;
            });
    }

    public get immutable() {
        const value = this._response.headers['cache-control'];
        const cacheControl = typeof value === 'string' ? value : value[0];
        return cacheControl.includes('immutable');
    }

    public get success() {
        return this._response.isOkStatusCode;
    }

    expectImmutable() {
        expect(this.immutable).to.be.true;
    }

    expectMutable() {
        expect(this.immutable).to.be.false;
    }
}
