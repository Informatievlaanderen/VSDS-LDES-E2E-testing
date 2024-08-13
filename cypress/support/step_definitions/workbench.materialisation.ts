/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { testPartialPath, range } from "./common_step_definitions";
import { timeouts } from "../common";

Given('I create the rdf4j repository', () => {
    const url = `http://localhost:8080/rdf4j-workbench/repositories/NONE/create`;
    const data = 'type=memory&Repository+ID=test&Repository+title=Memory+store&Persist=true&Sync+delay=0&Query+Evaluation+Mode=STANDARD'
    cy.request({method: 'POST', url: url, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data,})
        .then(response => 200 <= response.status && response.status < 300)
})

When('I upload {int} files from the {string} directory to the workbench', (amount: number, directory: string) => {
    const url = `http://localhost:8081/rdf4j-pipeline`;
    range(1, amount).forEach(member => {
        const fileName = `${testPartialPath()}/data/${directory}/${member}.nq`;
        cy.readFile(fileName, 'utf8')
            .then(data => cy.request({method: 'POST', url: url, headers: { 'Content-Type': 'application/N-quads' }, body: data,})
                                .then(response => 200 <= response.status && response.status < 300)
            )
    })
})

Then('I wait for the rdf4j repository to contain {int} triples', (tripleCount: number) => {
    getRepositorySize(tripleCount);
})

function getRepositorySize(tripleCount: number) {
    const url = `http://localhost:8080/rdf4j-server/repositories/test/size`;
    cy.waitUntil(
        () => cy.request({method: 'GET', url: url,})
            .then(response => response.body == tripleCount),
        {timeout: timeouts.fastAction, interval: timeouts.fastCheck, errorMsg: `Timed out waiting for checking number of triples in server`}
    );
}

Then('the rdf4j repository still contains {int} triples', (tripleCount: number) => {
    getRepositorySize(tripleCount);
});

Then('the rdf4j repository contains the updated triple', () => {
    const url = `http://localhost:8080/rdf4j-server/repositories/test`;
    const fileName = `${testPartialPath()}/data/query.rq`;
    cy.readFile(fileName, 'utf8')
        .then(data => cy.request({method: 'POST', url: url, headers: { 'Content-Type': 'application/sparql-query' }, body: data,})
            .then(response => expect(response.body).to.contain('CHANGED'))
        )
});