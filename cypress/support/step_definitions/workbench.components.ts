/// <reference types="cypress" />

import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { unique } from "underscore";
import { GraphDatabase } from "../services";
import { setAdditionalEnvironmentSetting, testPartialPath } from "./common_step_definitions";

interface TypeAndValue {
  type: string,
  value: string,
}

interface Observation {
  observation: TypeAndValue,
  type: TypeAndValue,
  result: TypeAndValue,
}

export const graphDatabase = new GraphDatabase('http://localhost:7200')

Then('the graph database contains {int} observations for the same sensor', (count: number) => {
  return graphDatabase.query('observations', `${testPartialPath()}/graphdb/query.rq`)
      .then((observations: Observation[]) => {
        expect(observations).to.have.length(count);

        const sensors = unique(observations.map(x => x.observation.value));
        expect(sensors).to.have.length(1);
        expect(sensors.shift()).to.be.equal("urn:ngsi-ld:WaterQualityObserved:woq:sensor-1");

        const values = unique(observations.map(x => x.result.value));
        expect(values).to.have.length(1);
      });

})

Given('environment variable {string} is defined as the hostname', (variable: string) => {
  return cy.exec('hostname').then(result => setAdditionalEnvironmentSetting(variable, result.stdout));
})
