/// <reference types="cypress" />

import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { GraphDatabase } from '../services/graph-database';
import { testPartialPath } from '../step_definitions/common_step_definitions'
import { unique } from "underscore";

const graphDatabase = new GraphDatabase('http://localhost:7200')

Given('the graph database is available and configured', () => {
  graphDatabase.waitAvailable();

  cy.exec(`rm -f ${testPartialPath()}/graphdb/init.lock`);
})

interface TypeAndValue {
  type: string,
  value: string,
}

interface Observation {
  observation: TypeAndValue,
  type: TypeAndValue,
  result: TypeAndValue,
}

Then('the graph database contains {int} observations for the same sensor', (count: number) => {
  cy.exec("curl -s --location 'http://localhost:7200/repositories/observations' \
  --header 'Accept: application/x-sparqlstar-results+json' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'query=PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
  PREFIX sosa: <http://www.w3.org/ns/sosa/>\n\
  PREFIX omObservation: <http://def.isotc211.org/iso19156/2011/Observation#>\n\
  select * where { \n\
      ?observation <http://def.isotc211.org/iso19156/2011/SamplingFeature#SF_SamplingFeatureCollection.member> [\n\
          omObservation:OM_Observation.observedProperty ?type ;\n\
          omObservation:OM_Observation.result [\n\
              <http://def.isotc211.org/iso19103/2005/UnitsOfMeasure#Measure.value> [\n\
                      <https://schema.org/value> ?result\n\
                  ]\n\
              ]\n\
          ]\n\
  }'").then(result => {
    const response = JSON.parse(result.stdout);
    const observations = response.results.bindings as Observation[];
    expect(observations).to.have.length(count);
    const sensors = unique(observations.map(x => x.observation.value));
    expect(sensors).to.have.length(1);
    expect(sensors.shift()).to.be.equal("urn:ngsi-ld:WaterQualityObserved:woq:sensor-1");
    const values = unique(observations.map(x => x.result.value));
    expect(values).to.have.length(1);
  });
})
