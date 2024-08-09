import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { server } from "./common_step_definitions";
import { Fragment } from "../ldes";
import { timeouts } from "..";

const ldes = 'observations';
const view = 'by-page';
let fragment: Fragment;

When('the {int} members are available in the first fragment', (count: number) => {
  return server.getLdes(ldes)
    .then(ldes => new Fragment(ldes.viewUrl(view)))
    .then(view => cy.waitUntil(() => view.visit().then(x => x.hasSingleRelationLink),
      { timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: 'Timed out waiting for first fragment to contain a single link' }).then(() => view))
    .then(view => new Fragment(view.relation.link))
    .then(page => cy.waitUntil(() => page.visit().then(x => (fragment = x, x.members.length === count)),
      { timeout: timeouts.fastAction, interval: timeouts.check, errorMsg: `Timed out waiting for first fragment to contain '${count}' members` }));
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
