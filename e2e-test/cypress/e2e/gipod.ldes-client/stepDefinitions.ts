import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

// Given(/a Simulator-Workflow-Sink-Mongo context is started/, () => { return "pending"; });
// Given(/I have aliased the simulator's pre-seeded data set/, () => { return "pending"; });
// Given(/I have logged on to the Apache NiFi UI/, () => { return "pending"; });
// Given(/I have uploaded a workflow with an LDES client/, () => { return "pending"; });
// Given(/I have seeded the simulator with an initial data set/, () => { return "pending"; });
// Given(/I started the workflow/, () => { return "pending"; });
// Given(/the last fragment is being re-requested/, () => { return "pending"; });
// When(/I start the workflow/, () => { return "pending"; });
// When(/I seed a data set update/, () => { return "pending"; });
// Then(/the sink contains the correct number of members ({int})/, (count) => { return "pending"; });


Given('a Simulator-Workflow-Sink-Mongo context is started', () => {
    //export COMPOSE_FILE="../../../support/context/simulator-workflow-sink-mongo/docker-compose.yml"
    //docker compose --env-file user.env up

    cy.exec('docker compose -f ../../support/context/simulator-workflow-sink-mongo/docker-compose.yml -e SINGLE_USER_CREDENTIALS_USERNAME=E2ETest');
    

    // return "pending";
})