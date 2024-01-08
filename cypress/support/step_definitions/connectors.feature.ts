import {Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {clientWorkbench, testPartialPath} from "./common_step_definitions";
import {checkSuccess, timeouts} from "../common";


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

Then('The LDES Client is waiting for the token', () => {
    clientWorkbench.waitForDockerLog("waiting for token")
})

Then('The LDES Client is processing the LDES', () => {
    clientWorkbench.waitForDockerLog("LdiConsoleOut")
})

When('I initiate a transfer', () => {
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
        const policyId = catalogResponse.body["dcat:dataset"]["odrl:hasPolicy"]["@id"];
        cy.log(`Obtained policyId: ${policyId}`)
        cy.request({
                method: 'POST',
                url: 'http://localhost:29193/management/v2/contractnegotiations',
                headers: {'Content-Type': 'application/json'},
                body: createNegotiationInitiateRequestDto(policyId)
            }
        ).then(contractResponse => {
            const contractNegotiationId = contractResponse.body["@id"];
            cy.log(`Obtained contractNegotiationId: ${contractNegotiationId}`);
            cy.log(`Start waiting for contract negotiation with id ${contractNegotiationId} to finalize.`)
            cy.waitUntil(() => isContractReady(contractNegotiationId),
                {
                    timeout: timeouts.slowAction,
                    interval: timeouts.slowCheck,
                    errorMsg: `Timed out waiting for the contract negotiation to finalize.'`
                }
            ).then(() => {
                cy.request({
                    method: 'GET',
                    url: 'http://localhost:29193/management/v2/contractnegotiations/' + contractNegotiationId,
                    headers: {'Content-Type': 'application/json'}
                }).then(contractNegotiationDto => {
                    const contractAgreementId = contractNegotiationDto.body['edc:contractAgreementId'];
                    cy.log(`Obtained contractAgreementId: ${contractAgreementId}`)
                    cy.request({
                        method: 'POST',
                        url: "http://localhost:8082/client-pipeline/transfer",
                        headers: {'Content-Type': 'application/json'},
                        body: createTransferRequest(contractAgreementId)
                    })
                });
            });
        });
    })
})

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
        "connectorId": "provider",
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
