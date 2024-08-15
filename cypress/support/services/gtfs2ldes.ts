/// <reference types="cypress" />

import { timeouts } from "../common";
import { CanCheckAvailability } from "./interfaces";

export interface SentCount {
    sent: number;
    done: boolean;
}

export class Gtfs2Ldes implements CanCheckAvailability {

    public get serviceName() {
        return 'gtfs2ldes-js'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Starting processing of GTFS source"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`).then(result => cy.waitUntil(
            () => this.isReady(result.stdout), 
            { timeout: timeouts.ready, interval: timeouts.fastCheck, errorMsg: `Timed out waiting for container '${this.serviceName}' to be available` }
        ));
    }

    private isPostingConnections(containerId: string) {
        return cy.exec(`docker logs -n 1 ${containerId}`).then(result => result.stdout.startsWith('Posted'));
    }

    waitSendingLinkedConnections() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`).then(result => cy.waitUntil(
            () => this.isPostingConnections(result.stdout), 
            { timeout: timeouts.verySlowAction, interval: timeouts.slowCheck, errorMsg: `Timed out waiting for container '${this.serviceName}' to start sending connections` }
            ));
    }

    sendLinkedConnectionCount(): Cypress.Chainable<SentCount> {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`).then(result =>
            cy.exec(`docker logs -n 5 ${result.stdout}`)
                .then(result => result.stdout)
                .then(lines => {
                    let result: SentCount;
                    const doneMatch = lines.match(/posted (?<count>[0-9]+) new versioned Connections/);
                    if (doneMatch) {
                        result = { done: true, sent: Number.parseInt(doneMatch.groups.count) };
                    } else {
                        const lastLine = lines.split("\n").reverse().filter(x => x.startsWith('Posted')).pop();
                        const postedMatch = lastLine?.match(/^Posted (?<count>[0-9]+) Connection updates/);
                        if (postedMatch) {
                            result = { done: false, sent: Number.parseInt(postedMatch.groups.count) };
                        } else {
                            result = { done: false, sent: 0 };
                        }
                    }
                    return result;
                })
        );
    }
}