import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

var responseCode: number;

const member: string = `@prefix dc11: <http://purl.org/dc/elements/1.1/> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ns0: <http://www.w3.org/ns/adms#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix ns1: <https://gipod.vlaanderen.be/ns/gipod#> .
@prefix ns2: <http://www.w3.org/ns/> .
@prefix prov: <http://www.w3.org/ns/prov#> .

<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/1/0>
  dc:created "2022-05-230T09:58:15"^^xsd:dateTime ;
  dc:isVersionOf <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/1> ;
  dc:modified "2022-05-20T09:58:15.8646433Z"^^xsd:dateTime ;
  a <https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder> ;
  ns0:identifier [
    a ns0:Identifier ;
    skos:notation "1"^^ns1:gipodId ;
    ns0:schemaAgency "https://gipod.vlaanderen.be"@nl-be
  ] ;
  prov:generatedAtTime "2023-11-09T10:24:23.8646433Z"^^xsd:dateTime .
`

When("I create an eventstream on port {int}", (port: number) => {
    return cy.request({
        method: 'GET',
        url: 'http://localhost:' + port + '/admin/api/v1/eventstreams',
        failOnStatusCode: false
    }).then(response => responseCode = response.status)
})

When("I fetch the swagger docs on port {int}", (port: number) => {
    return cy.request({
        method: 'GET',
        url: 'http://localhost:' + port + '/v3/api-docs',
        failOnStatusCode: false
    }).then(response => responseCode = response.status)
})

When("I send a member on port {int}", (port: number) => {
    return cy.request({
        method: 'POST',
        url: 'http://localhost:' + port + '/mobility-hindrances',
        body: member,
        headers: {"Content-Type": 'text/turtle'},
        failOnStatusCode: false
    }).then(response => responseCode = response.status)
})

When("I request a fragment on port {int}", (port: number) => {
    return cy.request({
        method: 'GET',
        url: 'http://localhost:' + port + '/mobility-hindrances',
        failOnStatusCode: false
    }).then(response => responseCode = response.status)
})


Then("The response status code is {int}", (statusCode: number) => {
    expect(responseCode).to.equal(statusCode)
})