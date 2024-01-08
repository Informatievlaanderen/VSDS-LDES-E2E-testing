import {When} from "@badeball/cypress-cucumber-preprocessor";
import {testPartialPath, clientWorkbench, createAndStartService, jsonDataGenerator, server} from "./common_step_definitions";
import {checkSuccess, timeouts} from "../common";


When('The provider connector is configured', () => {
    const cmd = `sh ${testPartialPath()}/config/config-provider-connector.sh`;
    cy.log(cmd).exec(cmd, { log: true, failOnNonZeroExit: false })
        .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
})

When('The consumer connector is configured', () => {
    const cmd = `sh ${testPartialPath()}/config/config-consumer-connector.sh`;
    cy.log(cmd).exec(cmd, { log: true, failOnNonZeroExit: false })
        .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
})