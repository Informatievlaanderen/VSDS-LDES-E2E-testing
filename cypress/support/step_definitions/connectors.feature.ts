import {Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {clientConnectorFailsOnStatusCode, workbench, testPartialPath} from "./common_step_definitions";
import {checkSuccess, timeouts} from "../common";

let policyId: string;
let contractNegotiationId: string;

When('The provider connector is configured', () => {
    const cmd = `sh ${testPartialPath()}/config/config-provider-connector.sh`;
    cy.log(cmd).exec(cmd, {log: true, failOnNonZeroExit: false})
        .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
})

When('The consumer connector is configured', () => {
    const cmd = `sh ${testPartialPath()}/config/config-consumer-connector.sh`;
    cy.log(cmd).exec(cmd, {log: true, failOnNonZeroExit: false})
        .then(result => checkSuccess(result).then(success => expect(success).to.be.true));
})

When('The consumer connector is registered with the authority', () => {
    const consumerJwt = "eyJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6Y29uc3VtZXIiLCJzdWIiOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6Y29uc3VtZXIiLCJhdWQiOiJodHRwOi8vZmVkZXJhdGVkLWF1dGhvcml0eTo4MTgwL2F1dGhvcml0eSIsImV4cCI6MTc5MDk4MzU1OH0.6rKRqLNW9ebVa563bAGagmAUx3pQQJTyHvhjiZ1YdCR_BjxA7TnDPe3kRhdzqqoAndjIbYjt39_iHVW6S2k4Pg"

    cy.request({
        method: 'POST',
        url: 'http://localhost:38180/authority/registry/participant',
        headers: {
            'Authorization': `Bearer ${consumerJwt}`
        }
    })
})

When('The federated catalog is registered with the authority', () => {
    const authorityJwt = "eyJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6ZmVkZXJhdGVkLWF1dGhvcml0eSIsInN1YiI6ImRpZDp3ZWI6ZGlkLXNlcnZlcjpmZWRlcmF0ZWQtYXV0aG9yaXR5IiwiYXVkIjoiaHR0cDovL2ZlZGVyYXRlZC1hdXRob3JpdHk6ODE4MC9hdXRob3JpdHkiLCJleHAiOjE3OTA5ODM1NTh9.jmOkFKJ3Cy9Kd4oXnZocP2NShCySZYKrBfrY-BFEGBPQkA1dLkr1_4c24ZIxLcP8P1t5uvpUYsw2ivNpQkjFYA"

    cy.request({
        method: 'POST',
        url: 'http://localhost:38180/authority/registry/participant',
        headers: {
            'Authorization': `Bearer ${authorityJwt}`
        }
    })
})

Then('The LDES Client is waiting for the token', () => {
    workbench.waitForDockerLog("waiting for token")
})

Then('The LDES Client is processing the LDES', () => {
    workbench.waitForDockerLog("LdiConsoleOut")
})

When('I get the policyId from the consumer catalog', () => {
    cy.request(
        {
            method: 'POST',
            url: 'http://localhost:29193/management/v2/catalog/request',
            headers: {'Content-Type': 'application/json'},
            body: `{
                  "@context": {
                    "edc": "https://w3id.org/edc/v0.0.1/ns/"
                  },
                  "providerUrl": "http://provider-connector:19194/protocol",
                  "protocol": "dataspace-protocol-http"
                }`
        }
    ).then(catalogResponse => {
        policyId = catalogResponse.body["dcat:dataset"]["odrl:hasPolicy"]["@id"];
        cy.log(`Obtained policyId: ${policyId}`);
    });
});

Then('The federated catalog will eventually contain a policy', () => {
    cy.waitUntil(() => {
            return hasFederatedCatalogPolicy();
        },
        {
            timeout: timeouts.slowAction,
            interval: timeouts.slowCheck,
            errorMsg: `Timed out waiting for the contract negotiation to finalize.'`
        }
    )
});

function hasFederatedCatalogPolicy() {
    return cy.request({
        method: 'POST',
        url: 'http://localhost:38181/api/federatedcatalog',
        headers: {'Content-Type': 'application/json'},
        body: `{"criteria":[]}'`
    }).then(catalogResponse => {
        expect(catalogResponse.body).length(1)
    })
}

Then('I wait for the connectors to have started', () => {
    const includeString = 'Incoming CatalogRequestMessage';
    const containerName = 'provider-connector';
    cy.exec(`docker ps -f "name=${containerName}$" -q`)
        .then(result => {
            return cy.waitUntil(
                () => cy.exec(`docker logs ${result.stdout}`).then(result => result.stdout.includes(includeString)),
                {
                    timeout: timeouts.slowAction,
                    interval: timeouts.slowCheck,
                    errorMsg: `Timed out waiting for ${containerName} container log to include '${includeString}'`
                });
        });
})

When('I start negotiating a contract', () => {
    cy.request({
            method: 'POST',
            url: 'http://localhost:29193/management/v2/contractnegotiations',
            headers: {'Content-Type': 'application/json'},
            body: createNegotiationInitiateRequestDto(policyId)
        }
    ).then(contractResponse => {
        contractNegotiationId = contractResponse.body["@id"];
        cy.log(`Obtained contractNegotiationId: ${contractNegotiationId}`);
    });
});

Then('I wait for the contract negotiation to finish', () => {
    cy.log(`Start waiting for contract negotiation with id ${contractNegotiationId} to finalize.`)
    cy.waitUntil(() => isContractReady(contractNegotiationId),
        {
            timeout: timeouts.slowAction,
            interval: timeouts.slowCheck,
            errorMsg: `Timed out waiting for the contract negotiation to finalize.'`
        }
    )
})

When('I start a transfer', () => {
    cy.request({
        method: 'GET',
        url: 'http://localhost:29193/management/v2/contractnegotiations/' + contractNegotiationId,
        headers: {'Content-Type': 'application/json'}
    }).then(contractNegotiationDto => {
        const contractAgreementId = contractNegotiationDto.body['contractAgreementId'];
        cy.log(`Obtained contractAgreementId: ${contractAgreementId}`)
        cy.request({
            method: 'POST',
            url: "http://localhost:8082/client-pipeline/transfer",
            headers: {'Content-Type': 'application/json'},
            body: createTransferRequest(contractAgreementId)
        })
    });
});

function isContractReady(contractNegotiationId: string) {
    return cy.exec(`curl -X GET http://localhost:29193/management/v2/contractnegotiations/${contractNegotiationId}  --header 'Content-Type: application/json'`,
        {failOnNonZeroExit: false}).then(exec => exec.stdout.includes('FINALIZED'));
}

function createTransferRequest(contractId: string) {
    return `{
        "@context": {
          "@vocab": "https://w3id.org/edc/v0.0.1/ns/"
        },
        "@type": "TransferRequest",
        "connectorId": "did:web:did-server:provider",
        "connectorAddress": "http://provider-connector:19194/protocol",
        "contractId": "${contractId}",
        "assetId": "devices",
        "protocol": "dataspace-protocol-http",
        "dataDestination": {
          "@type": "DataAddress",
          "type": "HttpProxy"
        },
        "privateProperties": {
          "receiverHttpEndpoint" : "http://ldio-workbench:8082/client-pipeline/token"
        }
    }`;
}

function createNegotiationInitiateRequestDto(policyId: string) {
    return `{
      "@context": {
        "edc": "https://w3id.org/edc/v0.0.1/ns/",
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "NegotiationInitiateRequestDto",
      "connectorId": "provider",
      "connectorAddress": "http://provider-connector:19194/protocol",
      "consumerId": "consumer",
      "providerId": "provider",
      "protocol": "dataspace-protocol-http",
      "offer": {
       "offerId": "${policyId}",
       "assetId": "devices",
       "policy": {
         "@id": "${policyId}",
         "@type": "Set",
         "odrl:permission": [],
         "odrl:prohibition": [],
         "odrl:obligation": [],
         "odrl:target": "devices"
       }
      }
    }`;
}

Then('The status code is {int}', (code: number) => {
    clientConnectorFailsOnStatusCode(code);
})

