import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment, Relation } from "../ldes";
import { server } from "./common_step_definitions";

let rootFragment: Fragment;
let ldesName = 'mobility-hindrances';
let viewName = 'by-location';
let relations : Relation[];
let members = ['https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10496796/1192116'];

Then('the geo-spatial root fragment is not immutable', () => {
    server.checkRootFragmentMutable(ldesName, viewName).then(fragment => rootFragment = fragment);
})

Then('the geo-spatial fragment {string} contains the member', (tile: string) => {
    const relationUrl = `${server.baseUrl}/${ldesName}/${viewName}?tile=${tile}`;
    const relation = relations.find(x => x.link === relationUrl);
    expect(relation).not.to.be.undefined;
    new Fragment(relationUrl).visit().then(fragment => expect(fragment.members).to.eql(members));
})

Then('the geo-spatial root fragment contains multiple relations of type {string}', (relationType: string) => {
    relations = rootFragment.expectMultipleRelationOf(relationType, 4);
})