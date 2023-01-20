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
    
    cy.exec('docker compose up -d', {
        log:true, 
        env: {
            SINGLE_USER_CREDENTIALS_USERNAME:'Ruben',
            SINGLE_USER_CREDENTIALS_PASSWORD:'3d20ee76-af78-4875-9a27-7298378416ef',
            COMPOSE_FILE:"support/context/simulator-workflow-sink-mongo/docker-compose.yml",
            // LDES_SERVER_SIMULATOR_SEED_FOLDER:"../ldes-server-simulator/data/gipod",
            LDES_WORKBENCH_NIFI_TAG:"latest",
            LDES_SERVER_SIMULATOR_TAG:"latest",
            LDES_CLIENT_SINK_TAG:"latest",
            USECASE_NAME:"gipod-replicate-ldes"
        }
    });
    

    // return "pending";
})