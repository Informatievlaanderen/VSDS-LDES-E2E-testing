/// <reference types="cypress" />

import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { GraphDatabase } from '../services/graph-database';
import { unique } from "underscore";
import { setAdditionalEnvironmentSetting, testPartialPath } from "./common_step_definitions";
import { LdesWorkbenchNiFi } from "../services";
import { timeouts } from "../common";

const graphDatabase = new GraphDatabase('http://localhost:7200')
const workbenchNifi = new LdesWorkbenchNiFi('https://localhost:8443')


Given('the graph database is available and configured', () => {
  graphDatabase.waitAvailable();
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

const uniqueSeed = Date.now().toString();
const getUniqueId = () => Cypress._.uniqueId(uniqueSeed);
const clientId = getUniqueId();

Given('we are testing version {string} of the LDI NiFI components found in {string}', (version: string, partialUri: string) => {
  const repositorySnapshots = 'https://s01.oss.sonatype.org/service/local/repositories/snapshots/content';
  const bundle = 'be/vlaanderen/informatievlaanderen/ldes/ldi/nifi/ldi-processors-bundle';
  const url = `${repositorySnapshots}/${bundle}/${version}/${partialUri}`;
  const archive = `${testPartialPath()}/temp/ldi-processors-bundle.jar`;
  const downloadBundleCmd=`curl -s ${url} --output ${archive}`
  const unzipArchiveCmd = `unzip -q -j ${archive} *.nar -d ${testPartialPath()}/temp`;
  const rmArchiveCmd = `rm ${archive}`;
  const workflowDefinition = `${testPartialPath()}/nifi-workflow.json`;
  const createWorkflowCmd = `envsubst < ${testPartialPath()}/config/nifi-workflow-template.json > ${workflowDefinition}`
  return cy.exec(downloadBundleCmd, { log: true, timeout: timeouts.slowAction })
    .then(() => cy.exec(unzipArchiveCmd, {log: true}))
    .then(() => cy.exec(rmArchiveCmd, {log: true}))
    .then(() => cy.exec(createWorkflowCmd, {log:true, env: { LDI_PROCESSORS_VERSION: version }}));
})

When('I start the NIFI workflow', () => {
  const workflowDefinition = `${testPartialPath()}/nifi-workflow.json`;
  const removeWorkflowDefinition = `rm ${workflowDefinition}`;
  return workbenchNifi.requestAccessToken()
    .then(token => workbenchNifi.uploadWorkflow(token, clientId, workflowDefinition).then(workflowId => workbenchNifi.startWorkflow(token, workflowId))
    .then(() => workbenchNifi.waitIngestEndpointAvailable('http://localhost:9005/observations')))
    .then(() => cy.exec(removeWorkflowDefinition, {log: true}));
})

Then('we remove the LDI NiFi components', () => {
  const cmd = `rm -rf ${testPartialPath()}/temp/*.nar`;
  return cy.log(cmd).exec(cmd);
})
