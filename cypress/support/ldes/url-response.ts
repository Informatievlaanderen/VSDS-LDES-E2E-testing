/// <reference types="cypress" />
import N3 = require('n3');
import { Member } from './member';
import { mimeTypes, tree } from './rdf-common';
import { isomorphic } from "rdf-isomorphic";

export interface VisitOptions {
    mimeType: string,
}

export abstract class UrlResponse {
    private _response: Cypress.Response<any>;
    private _store: N3.Store | undefined;

    constructor(public url: string) { }

    visit(options?: Partial<VisitOptions>) {
        let request: { [key: string]: any } = { url: this.url };
        if (options?.mimeType) request = { ...request, headers: { accept: options.mimeType } };
        return cy.request(request).then(response => this._response = response).then(() => this);
    }

    refresh() {
        this._response = undefined;
        this._store = undefined;
        return cy.request(this.url).then(response => this._response = response).then(() => this);
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

    private isIsomorphic(contentA: string, contentB: string, mimeType: string): boolean {
        const parser = new N3.Parser({ format: mimeType });
        return isomorphic(parser.parse(contentA), parser.parse(contentB))
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
        if (content === 'string') return JSON.parse(content);
        return JSON.parse(JSON.stringify(content, null, 0));
    }

    expectContent(content: string | object) {
        const mimeType = this.mimeType;
        if (mimeType === mimeTypes.jsonld) {
            expect(this.roundTripJson(this.body)).to.deep.equal(this.roundTripJson(content));
        } else {
            expect(this.isIsomorphic(this.body, content as string, mimeType)).true
        }
    }

    get members(): Member[] {
        return this.store.getObjects(null, tree.member, null)
            .map(x => new Member(x.value, this.store.getQuads(x.value, null, null, null)));
    }

    get memberCount(): number {
        return this.store.getObjects(null, tree.member, null).length;
    }

    waitForResponseCode(httpCode: number) {
        return cy.waitUntil(
            () => cy.request({ url: this.url, failOnStatusCode: false }).then(response => response.status === httpCode),
            { timeout: 60000, interval: 5000 }
        );
    }
}
