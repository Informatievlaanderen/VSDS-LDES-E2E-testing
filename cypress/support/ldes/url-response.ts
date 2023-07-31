/// <reference types="cypress" />
import N3 = require('n3');
import { Member } from './member';
import { mimeTypes, tree } from './rdf-common';
import { isomorphic } from "rdf-isomorphic";
import * as jsonld from 'jsonld';
import * as RDF from "@rdfjs/types";
import { timeouts } from '../common';

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
        return cy.request(request)
            .then(response => this.parseResponse(response).then(quads => this._store = new N3.Store(quads)))
            .then(() => this);
    }

    refresh() {
        this._response = undefined;
        this._store = undefined;
        return cy.request(this.url)
            .then(response => this.parseResponse(response).then(quads => this._store = new N3.Store(quads)))
            .then(() => this);
    }

    private parseResponse(response: Cypress.Response<any>): Promise<RDF.Quad[]> {
        this._response = response;
        return this.parseContent(response.body, this.mimeType);
    }

    private parseContent(content: string | object, mimeType: string): Promise<RDF.Quad[]> {
        if (mimeType === mimeTypes.jsonld) {
            return jsonld.toRDF(content as jsonld.NodeObject) as Promise<RDF.Quad[]>;
        } else {
            const parser = new N3.Parser({ format: mimeType });
            const quads = parser.parse(content as string);
            return Promise.resolve(quads);
        }
    }

    protected get store(): N3.Store | undefined {
        return this._store;
    }

    protected get quads(): RDF.Quad[] {
        return this._store.getQuads(null, null, null, null);
    }

    public get immutable(): boolean {
        const value = this._response.headers['cache-control'];
        const cacheControl = typeof value === 'string' ? value : value[0];
        return cacheControl.includes('immutable');
    }

    public get success(): boolean {
        return this._response.isOkStatusCode;
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

    expectContent(content: string | object) {
        return this.parseContent(content, this.mimeType).then(quads => {
            expect(this.quads.length).to.equal(quads.length);
            expect(isomorphic(quads, this.quads)).true;
        });
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
            { timeout: timeouts.ready, interval: timeouts.check, errorMsg: `Timed out waiting for '${this.url}' to return HTTP code ${httpCode}` }
        );
    }
}
