import {Then, When} from "@badeball/cypress-cucumber-preprocessor";
import {clientWorkbench, testPartialPath} from "./common_step_definitions";
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

When('I register the consumer connector with the consumer connector', () => {
    const jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6Y29uc3VtZXIiLCJzdWI" +
        "iOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6Y29uc3VtZXIiLCJhdWQiOiJodHRwOi8vcHJvdmlkZXItY29ubmVjdG9yOjgxODAvYXV0aG9yaXR5I" +
        "iwiZXhwIjoxOTkwOTgzNTU4LCJqdGkiOiI0MzFiamE4Mi1hODI1LTRmMjQtOTI4Zi0yY2IyN2ZhODMxZDUifQ.tG4XBBzNiZvUYDOVu156B" +
        "115K0vzGb2wegR2qBXb6Q6Mk-0-sjMktBKXInMV60V44PAdt6yokX_TxtQ0LuTT47LOhxOzyTf1zAn4YddBqfHT1dgrFlpICPmdpJQgJXOVC" +
        "sKS2uE7RkHte6HKTGVVjhcS3cK0jBoBIk2kQRLp_l1fhLxc4lluGTAE04i9DT3_YOZohATtE97Tq9HM7dBVXbtBBGnPEAp7mw67v_UVuGtSgo" +
        "OmJtOThpqrFzB_hvCuYQ9a7QG7Zc0yJp00IsKMdmPf3HA9aDdbibOkVsMAxYcLMY_s5Yh5087nWukeiFIZQ-Xn9Z1_PKgpM8t4lM7TOg"

    cy.request(
        {
            method: 'POST',
            url: 'http://localhost:19195/authority/registry/participant',
            headers: {'Authorization': `Bearer ${jwt}`}
        }
    ).should(response => {
        expect(response.isOkStatusCode).to.eq(true);
    });
})

Then('The LDES Client is waiting for the token', () => {
    clientWorkbench.waitForDockerLog("waiting for token")
})

Then('The LDES Client is processing the LDES', () => {
    clientWorkbench.waitForDockerLog("LdiConsoleOut")
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
    return cy.exec(`curl -X POST http://localhost:8181/api/federatedcatalog  --header 'Content-Type: application/json' -d '{"criteria":[]}'`,
        {failOnNonZeroExit: false}).then(exec => exec.stdout.includes('odrl:hasPolicy'));
}

Then('I wait for the connectors to have started', () => {
    const includeString = 'Incoming catalog request';
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
