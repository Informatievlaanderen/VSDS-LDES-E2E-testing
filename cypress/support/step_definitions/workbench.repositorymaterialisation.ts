/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { testPartialPath, server, range } from "./common_step_definitions";
import { timeouts } from "../common";

Given('I create the {string} repository', (repo: string) => {
    const url = `http://localhost:8080/rdf4j-server/repositories/${repo}`;
    const fileName = `${testPartialPath()}/data/seed/config.ttl`;
        cy.waitUntil(
        () => cy.readFile(fileName, 'utf8').then(data => 
            cy.request({method: 'PUT', url: url, headers: { 'Content-Type': 'text/turtle' }, body: data,})
                .then(response => 200 <= response.status && response.status < 300)), 
        {timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: `Timed out waiting for checking number of triples in server`}
    );
})

When('I upload the {int} files from the {string} directory to the workbench', (amount: number, directory: string) => {
    const url = `http://localhost:8082/pipeline`;
    range(1, amount).forEach(member => {
        const fileName = `${testPartialPath()}/data/${directory}/${member}.nq`;
        cy.waitUntil(
            () => cy.readFile(fileName, 'utf8').then(data => 
                cy.request({method: 'POST', url: url, headers: { 'Content-Type': 'application/N-quads' }, body: data,})
                    .then(response => 200 <= response.status && response.status < 300)), 
            {timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: `Timed out waiting for upload of file '${fileName}' to '${url}' to succeed`}
    );

    })
    
})

Then('the repository {string} contains {int} triples', (repo: string, amount: number) => {
    const url = `http://localhost:8080/rdf4j-server/repositories/${repo}/size`;
    cy.waitUntil(
        () => cy.request({method: 'GET', url: url,})
                .then(response => expect(response.body).to.eql(amount))), 
        {timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: `Timed out waiting for checking number of triples in server`}

})