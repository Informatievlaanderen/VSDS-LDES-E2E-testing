import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { server, testPartialPath } from "./common_step_definitions";
import { Fragment } from "../ldes";
import { timeouts } from "..";
import { graphDatabase } from "./workbench.components";

const ldes = 'observations';
const view = 'by-page';
let fragment: Fragment;

When('the {int} members are available in the first fragment', (count: number) => {
  server.getLdes(ldes)
    .then(ldes => new Fragment(ldes.viewUrl(view)))
    .then(view => cy.waitUntil(() => view.visit().then(x => x.hasSingleRelationLink),
      { timeout: timeouts.fastAction, interval: timeouts.fastCheck, errorMsg: 'Timed out waiting for first fragment to contain a single link' }).then(() => view))
    .then(view => new Fragment(view.relation.link))
    .then(page => cy.waitUntil(() => page.visit().then(x => (fragment = x, x.members.length === count)),
      { timeout: timeouts.fastAction, interval: timeouts.fastCheck, errorMsg: `Timed out waiting for first fragment to contain '${count}' members` }));
})

Then('all subjects in both members are named nodes', () => {
  expect(fragment.subjects.every(x => x.termType === 'NamedNode')).to.be.true;
})

Then('no object in any member is a blank node', () => {
  expect(fragment.objects.every(x => x.termType !== 'BlankNode')).to.be.true;
})

Then('all skolem objects are unique', () => {
  const objects = fragment.objects.filter(x => x.termType === "NamedNode").map(x => x.value)
    .filter(x => x.startsWith('http://schema.org/.well-known/genid/'));
  const unique = objects.filter((x, i) => objects.findIndex(y => y === x) === i);
  expect(objects.length).to.be.equal(unique.length);
})

const expectedTripleCount = 92;
let skolemIdsQuery: string;

Then('the repository sink contains both members', () => {
  cy.waitUntil(() => graphDatabase.repositoryCount('observations').then(count => count === expectedTripleCount),
    { timeout: timeouts.fastAction, interval: timeouts.fastCheck, errorMsg: `Timed out waiting for repository to contain both members` }
  ).then(() => cy.readFile(`${testPartialPath()}/graphdb/skolem-ids.rq`).then((content: string) => skolemIdsQuery = content));
})

interface NodeResult {
  type: string;
  value: string;
}

interface SkolemId {
  bs: NodeResult;
}

interface GeneratedAtDate {
  date: NodeResult;
}

let skolemIds1: string[];
let skolemIds2: string[];
let updatedIds1: string[];
let updatedIds2: string[];

When('I retrieve the skolem IDs for both members', () => {
  graphDatabase.query('observations', skolemIdsQuery.replace('${OBSERVATION_URI}','https://example.org/id/observation/1'))
    .then((bindings: SkolemId[]) => bindings.map(x => x.bs.value))
    .then(ids => skolemIds1 = ids.sort())
    .then(() => skolemIdsQuery.replace('${OBSERVATION_URI}','https://example.org/id/observation/2'))
    .then(query => graphDatabase.query('observations', query))
    .then((bindings: SkolemId[]) => bindings.map(x => x.bs.value))
    .then(ids => skolemIds2 = ids.sort());
})

When('I retrieve the skolem IDs for both members again', () => {
  graphDatabase.query('observations', skolemIdsQuery.replace('${OBSERVATION_URI}','https://example.org/id/observation/1'))
    .then((bindings: SkolemId[]) => bindings.map(x => x.bs.value))
    .then(ids => updatedIds1 = ids.sort())
    .then(() => skolemIdsQuery.replace('${OBSERVATION_URI}','https://example.org/id/observation/2'))
    .then(query => graphDatabase.query('observations', query))
    .then((bindings: SkolemId[]) => bindings.map(x => x.bs.value))
    .then(ids => updatedIds2 = ids.sort());
})

Then('the repository sink contains the updated member', () => {
  cy.readFile(`${testPartialPath()}/graphdb/generated-at-dates.rq`)
    .then((query: string) => cy.waitUntil(
      () => graphDatabase.query('observations', query)
        .then((bindings: GeneratedAtDate[]) => bindings.map(x => x.date.value))
        .then(dates => dates.length === 2 && dates[0] !== dates[1]),
      { timeout: timeouts.averageAction, interval: timeouts.averageCheck, errorMsg: `Timed out waiting for repository to contain updated member` }
    ))
   .then(() => graphDatabase.repositoryCount('observations').then(count => expect(count).to.equal(expectedTripleCount)));  
})

Then('the skolem IDs for the second member are unchanged', () => {
  expect(skolemIds2).to.have.same.members(updatedIds2);
})

Then('the skolem IDs for the first member are updated', () => {
  expect(skolemIds1).to.not.have.any.members(updatedIds1);
})
