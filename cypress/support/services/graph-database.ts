/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";
export class GraphDatabase implements CanCheckAvailability {

  constructor(private baseUrl: string, private _serviceName?: string) { }

  public get serviceName() {
    return this._serviceName || 'graphdb';
  }

  public waitAvailable(collection: string = 'observations') {
    return cy.waitUntil(() => this.isReady(collection), { timeout: timeouts.ready, interval: timeouts.check, errorMsg: `Timed out waiting for container '${this.serviceName}' to be available` });
  }

  private isReady(collection:string) {
    return cy.exec(`curl --head --header 'Accept: text/plain' ${this.baseUrl}/repositories/${collection}/size`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
  }

}