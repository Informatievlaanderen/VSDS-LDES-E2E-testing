/// <reference types="cypress" />
import N3 = require('n3');
import { Member } from './member';
import { mimeTypes, tree } from './rdf-common';

export abstract class UrlResponse {
    private _response: Cypress.Response<any>;
    private _store: N3.Store | undefined;

    constructor(public url: string) { }

    visit(mimeType: string = mimeTypes.turtle) {
        const request = mimeType ? { url: this.url, headers: { accept: mimeType } } : { url: this.url };
        return cy.request(request).then(response => this._response = response).then(() => this);
    }

    protected get store(): N3.Store | undefined {
        const mimeType = this.mimeType;
        if (mimeType === mimeTypes.jsonld) {
            return undefined;
        } else {
            return this._store ? this._store : (this._store = this.parseRdf(this.body, mimeType));
        }
    }

    private parseRdf(content: string, mimeType: string): N3.Store {
        const parser = new N3.Parser({ format: mimeType });
        const quads = parser.parse(content);
        return new N3.Store(quads);
    }

    private formatRdf(store: N3.Store, mimeType: string): string {
        const writer = new N3.Writer({ format: mimeType });
        return writer.quadsToString(store.getQuads(null, null, null, null));
    }

    public get immutable(): boolean {
        const value = this._response.headers['cache-control'];
        const cacheControl = typeof value === 'string' ? value : value[0];
        return cacheControl.includes('immutable');
    }

    public get success(): boolean {
        return this._response.isOkStatusCode;
    }

    public get body(): string {
        return this._response.body;
    }

    public get mimeType(): string {
        return this._response.headers['content-type'] as string;
    }

    expectImmutable() {
        expect(this.immutable).to.be.true;
        return this;
    }

    expectMutable() {
        expect(this.immutable).to.be.false;
        return this;
    }

    private roundTripRdf(content: string, mimeType: string): string {
        return this.formatRdf(this.parseRdf(content, mimeType), mimeType);
    }

    private roundTripJson(content: string | object) {
        if (content === 'string') content = JSON.parse(content);
        return JSON.stringify(content, null, 0);
    }

    expectContent(content: string | object) {
        const mimeType = this.mimeType;
        if (mimeType === mimeTypes.jsonld) {
            expect(this.roundTripJson(this.body)).to.equal(this.roundTripJson(content));
        } else {
            expect(this.roundTripRdf(this.body, mimeType)).to.equal(this.roundTripRdf(content as string, mimeType));
        }
    }

    get members(): Member[] {
        return this.store.getObjects(null, tree.member, null)
            .map(x => new Member(x.value, this.store.getQuads(x.value, null, null, null)));
    } 

    get memberCount(): number {
        return this.store.getObjects(null, tree.member, null).length;
    }
    
}
