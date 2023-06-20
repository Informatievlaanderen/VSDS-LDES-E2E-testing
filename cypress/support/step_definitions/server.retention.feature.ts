/// <reference types="cypress" />
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Fragment } from '../ldes';
import { createAndStartService, currentMemberCount, dockerCompose, jsonDataGenerator, mongo, server } from "./common_step_definitions";
import { MongoRestApi, TestMessageGenerator } from "../services";
import { MemberGenerator } from "../services/member-generator";

const fragments: { [key: string]: Fragment } = {};

export const memberGenerator1 = new MemberGenerator('basic-retention_member-generator');
export const memberGenerator2 = new MemberGenerator('basic-retention_member-generator-2');

Given('I remove the {string} view from the {string} collection', (view: string, collection: string) => {
    server.removeView(collection, view);
})

Given('I start the message generator', () => {
    createAndStartService('ldes-message-generator')
        .then(() => memberGenerator1.waitAvailable());
})

Given('I wait for {int} seconds to start the server', (seconds: number) => {
    cy.wait((seconds + 1) * 1000);
})

Given('I seed the LDES server with a collection', () => {
    cy.fixture('/test-012/mobility-hindrance.ttl').then((body: string) => server.configureLdesFromTurtleContent(body));
})

When('I start the second message generator', () => {
    createAndStartService('ldes-message-generator-2')
        .then(() => memberGenerator2.waitAvailable());
})

When('I add a view with versionbased retention to the LDES server', () => {
    cy.fixture('/test-012/view-latest-version.ttl').then((body: string) => server.configureViewFromTurtleContent(body, 'mobility-hindrances'));
})


When('I add a view with timebased retention to the LDES server', () => {
    cy.fixture('/test-012/view-timebased.ttl').then((body: string) => server.configureViewFromTurtleContent(body, 'mobility-hindrances'));
})

When('I add a view with point in time retention to the LDES server', () => {
    const time = (new Date(Date.now() + 30 * 1000)).toISOString();
    cy.fixture('/test-012/view-point-in-time.ttl')
    .then((view: string) => view.replace('CURRENTTIME', time))
    .then((body: string) => server.configureViewFromTurtleContent(body, 'mobility-hindrances'));
})

When('I add a view with multiple retention policies to the LDES server', () => {
    const time = (new Date(Date.now() + 60 * 1000)).toISOString();
    cy.fixture('/test-012/view-combined.ttl')
    .then((view: string) => view.replace('CURRENTTIME', time))
    .then((body: string) => server.configureViewFromTurtleContent(body, 'mobility-hindrances'));
})

When('I wait for {int} seconds', (seconds: number) => {
    cy.wait((seconds + 1) * 1000);
})

When('I stop the message generator', () => {
    const command = `docker stop ${memberGenerator1.serviceName}`;
    cy.log(command).exec(command)
            .then(result => expect(result.code).to.equal(0));
    const rmCommand = `docker rm ${memberGenerator1.serviceName}`;
    cy.log(rmCommand).exec(rmCommand)
            .then(result => expect(result.code).to.equal(0));

})

When('I stop the second message generator', () => {
    const command = `docker stop ${memberGenerator2.serviceName}`;
    cy.log(command).exec(command)
            .then(result => expect(result.code).to.equal(0));
    const rmCommand = `docker rm ${memberGenerator2.serviceName}`;
    cy.log(rmCommand).exec(rmCommand)
            .then(result => expect(result.code).to.equal(0));

})

Then('The member count is between {int} and {int}', (lower: number, upper: number) => {
    currentMemberCount().then(count => {
        cy.log(count.toString());
        expect(lower <= count && count <= upper).to.be.true;
    });
})

Then('The member count is higher than {int}', (lower: number) => {
    currentMemberCount().then(count => {
        cy.log(count.toString());
        expect(lower <= count).to.be.true;
    });
})

Then('The member count remains between {int} and {int}', (lower: number, upper: number) => {
    var n:number = 0 
    while(n <= 15) {
        currentMemberCount().then(count => {
            cy.log(count.toString());
            expect(lower <= count && count <= upper).to.be.true;
        });
        n++;
        cy.wait(1000);
    } 
})

Then('The member count is increasing', () => {
    var firstCount;
    currentMemberCount().then(count => {
        cy.log(count.toString());
        firstCount = count;
    });
    cy.wait(11000)
    currentMemberCount().then(count => {
        cy.log(count.toString());
        expect(firstCount + 9 < count).to.be.true;
    });
})



