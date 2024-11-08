/// <reference types="cypress" />
import {Given, Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {range, testPartialPath} from "./common_step_definitions";
import {timeouts} from "../common";

Given('I create the rdf4j repository', () => {
    const url = `http://localhost:8080/rdf4j-workbench/repositories/NONE/create`;
    const data = 'type=memory&Repository+ID=test&Repository+title=Memory+store&Persist=true&Sync+delay=0&Query+Evaluation+Mode=STANDARD'
    cy.request({method: 'POST', url: url, headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: data,})
        .then(response => 200 <= response.status && response.status < 300)
})

When('I upload {int} files from the {string} directory to pipeline {string}', (amount: number, directory: string, pipeline: string) => {
    const url = `http://localhost:8081/${pipeline}`;
    range(1, amount).forEach(member => {
        const fileName = `${testPartialPath()}/data/${directory}/${member}.nq`;
        cy.readFile(fileName, 'utf8')
            .then(data => cy.request({
                    method: 'POST',
                    url: url,
                    headers: {'Content-Type': 'application/N-quads'},
                    body: data,
                })
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
        {
            timeout: timeouts.fastAction,
            interval: timeouts.fastCheck,
            errorMsg: `Timed out waiting for checking number of triples in server`
        }
    );
}

Then('the rdf4j repository still contains {int} triples', (tripleCount: number) => {
    getRepositorySize(tripleCount);
});

Then('the rdf4j repository contains the updated triple', () => {
    const url = `http://localhost:8080/rdf4j-server/repositories/test`;
    const fileName = `${testPartialPath()}/data/query.rq`;
    cy.readFile(fileName, 'utf8')
        .then(data => queryTripleStore(url, data))
        .then(response => expect(response.body.results.bindings[0].name.value).to.be.equal('CHANGED'))

});

Then('I wait for the virtuoso triple store to contain {int} triples', (tripleCount: number) => {
    expectVirtuosoSizeToBe(tripleCount)
});

Then('the virtuoso triple store still contains {int} triples', (tripleCount: number) => {
    expectVirtuosoSizeToBe(tripleCount)
});

Then('the virtuoso triple store contains a triple set with given name {string}', (name: string) => {
    expectNameToBe(name)
});

function expectNameToBe(name: string) {
    const url = `http://localhost:8890/sparql`;
    const fileName = `${testPartialPath()}/checks/name/query.rq`;
    cy.readFile(fileName, 'utf8')
        .then(data => queryTripleStore(url, data))
        .then(response => {
            console.log(response.body)
            return expect(response.body.results.bindings[0].name.value).to.be.equal(name)
        })
}

function expectVirtuosoSizeToBe(tripleCount: number) {
    return cy.waitUntil(() => getVirtuosoSize().then(actualSize => actualSize == tripleCount),
        {
            timeout: timeouts.fastAction,
            interval: timeouts.fastCheck,
            errorMsg: `Timed out waiting for checking number of triples in server`
        }
    );
}

function getVirtuosoSize() {
    let query = 'SELECT (COUNT(*) AS ?count) WHERE { GRAPH <http://example.graph.com> {?s ?p ?o }}';
    return queryTripleStore('http://localhost:8890/sparql', query)
        .then(response => response.body.results.bindings[0].count.value)
}

function queryTripleStore(url: string, query: string) {
    return cy.request({
        method: 'POST',
        url,
        headers: {'Content-Type': 'application/sparql-query', 'Accept': 'application/sparql-results+json'},
        body: query
    })
}

