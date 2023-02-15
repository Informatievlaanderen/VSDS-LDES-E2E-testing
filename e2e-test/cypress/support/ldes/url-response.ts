/// <reference types="cypress" />
import N3 = require('n3');


export abstract class UrlResponse {
    private _immutable: boolean | undefined = undefined;

    protected parser = new N3.Parser({ format: 'text/turtle' });
    protected store: N3.Store | undefined;


    constructor(private url: string) { }


    public get immutable() { return this._immutable; };

    visit() {
        return cy.request(this.url)
            .then(response => {
                const value = response.headers['cache-control'];
                const cacheControl: string = typeof value === 'string' ? value : value[0];
                this._immutable = cacheControl.includes('immutable');
                return response.body;
            })
            .then(body => {
                const quads = this.parser.parse(body);
                this.store = new N3.Store(quads);
                return this;
            });
    }
}
