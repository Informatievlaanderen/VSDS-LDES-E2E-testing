# Implement a simple flow from LdesClient to LdesServer with EDC Connectors.

This example is based
on [transfer-02-consumer-pull-http](https://github.com/eclipse-edc/Samples/tree/main/transfer/transfer-02-consumer-pull).

The purpose of this example is to show a data exchange between 2 connectors, one representing the
data provider (LDES Server) and the other, the consumer (LDES Client). It's based on a consumer pull usecase that you
can find
more details
on [Transfer data plane documentation](https://github.com/eclipse-edc/Connector/tree/main/extensions/control-plane/transfer/transfer-data-plane)
The provider and the consumer will run in two different containers of the same connector image.
The final goal of this example is to present the steps through which the 2 connectors will
have to pass so that the consumer can have access to the data, held by the provider.

Those steps are the following:

* Prepare the LDES Server
* Running the provider connector
* Running the consumer connector
* Running a Http server that will receive the Endpoint Data Reference on the consumer side, that
  contains the url to be used to get the data.
* Register data plane instance for provider connector
* Register data plane instance for consumer connector
* Create an Asset on the provider (The asset will be the data to be shared)
* Create an access policy on the provider (The policy will define the access right to the data)
* Create a contract definition on the provider

At this step, the consumer should be able to fetch the catalog from the provider and to see the
contract offer generated from the resources that have been created.

Once the catalog is available, to access the data, the consumer should follow the following steps:

* Performing a contract negotiation with the provider
* Performing a transfer
    * The consumer will initiate a file transfer
    * The provider will send an EndpointDataReference to the consumer
* The consumer could reach the endpoint and access the data

> For the sake of simplicity, we will use an in-memory catalog and fill it with just one single
> asset. This will be deleted after the provider shutdown.

# Server setup

To prepare the LDES Server we use the following containers:

- ldes-server: The actual server.
- test-message-generator: Generates messages to seed the server with data.
- ldio-server-seeder: ETL pipeline between the message generator and the server to insert the generated data into the
  server.
- ldes-mongodb: Data persistence used by the server.

Start the LDES Server:

```bash
docker compose up -d
```

Please ensure that the LDES Server is ready to ingest by following the container log until you see the following
message `Cancelled mongock lock daemon`:

```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```

Press `CTRL-C` to stop following the log.

> **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh)
> to setup the LDES with its views:

```bash
chmod +x ./config/seed.sh
sh ./config/seed.sh
```

Seed the LDES Server by starting the message generator:

   ```bash
   docker compose up test-message-generator -d
   ```

Verify that messages are correctly ingested by the server:

```bash
curl http://localhost:8081/devices/paged?pageNumber=1
```

### Provider connector

The provider connector is the one providing EndpointDataReference to the consumer after it initiates
a transfer.

### Consumer connector

The consumer is the one "requesting" the data to the provider.

# How to run a connector

In fact, in the configuration of our example, both the provider and the consumer are connectors.
Therefore, to set up our example, we need to start a connector with the configuration for a provider
and another one with the configuration of a consumer.

It is important to note that only the property file differs between the consumer and the provider.
You can find the configuration file in the directories below:

* [provider](http-pull-provider/provider-configuration.properties)
* [consumer](http-pull-consumer/consumer-configuration.properties)

The section bellow will show you some explanation about some of the properties that you can find in
the configuration files.

#### 1. edc.receiver.http.endpoint

This property is used to define the endpoint where the connector consumer will send the
EndpointDataReference.

#### 2. edc.dataplane.token.validation.endpoint

This property is used to define the endpoint exposed by the control plane to validate the token.

#### 3. ports

Assuming you didn't change the ports in config files, the consumer will listen on the
ports `29191`, `29192` (management API) and `29292` (IDS API) and the provider will listen on the
ports `12181`, `19182` (management API) and `19282` (IDS API).

# Run the sample

Running this sample consists of multiple steps, that are executed one by one and following the same
order.

> Please in case you have some issues with the jq option, not that it's not mandatory, and you can
> drop it from the command. it's just used to format the output, and the same advice should be
> applied to all calls that use `jq`.

### 0.1 Federated catalog connector - State before datasets are provided by the provider connector

When the federated catalog functionality of the authority connector is started, it will crawl the connectors defined
in [nodes-dc.json](federated-authority/nodes-dc.json).
In our test, this is done for the first time, 5 seconds after startup as defined by "
edc.catalog.cache.execution.delay.seconds" in the [config](federated-authority/catalog-configuration.properties).

We can request the Federated Catalog with the following request:

```bash
curl 'http://localhost:8181/api/federatedcatalog' \
    -H 'Content-Type: application/json' \
    -d '{"criteria":[]}' \
    -s | jq
```

If you do this before the provider connectors have been crawled, then you will get an empty response:

```json
[]
```

After the first crawl we get the following response, which contains the connector but no datasets yet:

```json
[
  {
    "@id": "b05dd09e-f1d4-4c6b-9174-3b532480eb7b",
    "@type": "dcat:Catalog",
    "dcat:dataset": [],
    "dcat:service": {
      "@id": "c3e3e29b-84c8-4322-af59-7a4c524e190e",
      "@type": "dcat:DataService",
      "dct:terms": "connector",
      "dct:endpointUrl": "http://provider-connector:19194/protocol"
    },
    "edc:originator": "http://provider-connector:19194/protocol",
    "edc:participantId": "provider",
    "@context": {
      "dct": "https://purl.org/dc/terms/",
      "edc": "https://w3id.org/edc/v0.0.1/ns/",
      "dcat": "https://www.w3.org/ns/dcat/",
      "odrl": "http://www.w3.org/ns/odrl/2/",
      "dspace": "https://w3id.org/dspace/v0.8/"
    }
  }
]
```

### 0.2 Authentication

To authenticate our connectors, we use the [IdentityHub](https://github.com/eclipse-edc/IdentityHub/). 
However, due to a limitation, RSA keys cannot be used.

#### 0.2.0 Preparation

Make sure that for each participant in the dataspace, there is a did.json file present. 
This should be built up based on the template-did.json file containing :
* a service that points to IdentityHub service
* A JWK based on the public key of the participant. To be filled in the ``publicKeyJwk`` field. This can be computed by the following command  

#### 0.2.1 Onboarding

Before we can retrieve an LDES, we will use the following `curl` command to register the participant to the dataspace;

```bash
curl --location --request POST 'localhost:38180/authority/registry/participant' \
--header 'Authorization: Bearer eyJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6Y29uc3VtZXIiLCJzdWIiOiJkaWQ6d2ViOmRpZC1zZXJ2ZXI6Y29uc3VtZXIiLCJhdWQiOiJodHRwOi8vZmVkZXJhdGVkLWF1dGhvcml0eTo4MTgwL2F1dGhvcml0eSIsImV4cCI6MTc5MDk4MzU1OH0.6rKRqLNW9ebVa563bAGagmAUx3pQQJTyHvhjiZ1YdCR_BjxA7TnDPe3kRhdzqqoAndjIbYjt39_iHVW6S2k4Pg'
```

The `Authorization` header is a `JWT` token. This token is used to authenticate the authority. The
token is signed with the private key of the authority. The token is signed with the following
command;

We can use [jwt.io](https://jwt.io/) to create the token

Header:

```json
{
  "alg": "ES256"
}
```

Payload:

```json
{
  "iss": "did:web:did-server:consumer",
  "sub": "did:web:did-server:consumer",
  "aud": "http://federated-authority:8180/authority",
  "exp": 1790983558
}
```

Signature:

Use the public and private key of the requestor to sign the token.
One important thing to note is that [jwt.io](https://jwt.io/)  expects the private key to be in
`PKCS#8` format. However, the private key resolver expects the private key to be in `EC` format.
Therefore, we need to convert the private key to `PKCS#8` format before signing the token. We can
use the following command to convert the private key to `PKCS#8` format;

```bash
openssl pkcs8 -topk8 -nocrypt -in private.key -out private-pkcs.key
```

To check VCs of the consumer connector (after successful registration you should get base64 encoded JWT):
```bash
curl --location 'localhost:29191/api/identity-hub' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "descriptor": {
                "method": "CollectionsQuery"
            }
        }
    ]
}'
```


### 1. Provider connector - Register data plane instance for provider

Before a consumer can start talking to a provider, it is necessary to register the data plane
instance of a connector. This is done by sending a POST request to the management API of the
provider connector. The request body should contain the data plane instance of the consumer
connector.

The registration of the provider data plane instance is done by sending a POST
request to the management API of the connector.

```bash
curl -H 'Content-Type: application/json' \
     -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "http-pull-provider-dataplane",
           "url": "http://provider-connector:19192/control/transfer",
           "allowedSourceTypes": [ "HttpData" ],
           "allowedDestTypes": [ "HttpProxy", "HttpData" ],
           "properties": {
             "https://w3id.org/edc/v0.0.1/ns/publicApiUrl": "http://localhost:19291/public/"
           }
         }' \
     -X POST "http://localhost:19193/management/v2/dataplanes" | -s | jq
```

### 2. Consumer connector - Register data plane instance for consumer

The same thing that is done for the provider must be done for the consumer

```bash
curl -H 'Content-Type: application/json' \
     -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "http-pull-consumer-dataplane",
           "url": "http://consumer-connector:29192/control/transfer",
           "allowedSourceTypes": [ "HttpData" ],
           "allowedDestTypes": [ "HttpProxy", "HttpData" ],
           "properties": {
             "https://w3id.org/edc/v0.0.1/ns/publicApiUrl/publicApiUrl": "http://localhost:29291/public/"
            }
         }' \
             -X POST "http://localhost:29193/management/v2/dataplanes"
```

### 3. Provider connector - Create an Asset on the provider side

The provider connector needs to transfer a file to the location specified by the consumer connector
when the data are requested. In order to offer any data, the provider must maintain an internal list
of resources offered, through a contract offer, the so-called "catalog".

The following request creates an asset on the provider connector.

```bash
curl -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "devices",
           "properties": {
             "name": "device models",
             "contenttype": "application/n-quads"
           },
           "dataAddress": {
             "type": "HttpData",
             "name": "Test asset",
             "baseUrl": "http://ldes-server:8081/devices",
             "proxyPath": "true",
             "proxyQueryParams": "true",
             "contenttype": "application/n-quads",
             "header:Accept": "application/n-quads"
           }
         }' -H 'content-type: application/json' http://localhost:19193/management/v3/assets \
         -s | jq
```

> It is important to note that the `baseUrl` property of the `dataAddress` is a fake data used for
> the purpose of this example. It will be the data that the consumer will pull on the sample
> execution.

Additional properties on `HttpData` can be used to allow consumers to enrich the data request:

- `proxyPath`: allows specifying additional path segments.
- `proxyQueryParams`: allows specifying query params.
- `proxyBody`: allows attaching a body.
- `proxyMethod`: allows specifying the Http Method (default `GET`)

### 4. Provider connector - Create a Policy on the provider

In order to manage the accessibility rules of an asset, it is essential to create a policy. However,
to keep things simple, we will choose a policy that gives direct access to all the assets that are
associated within the contract definitions.
This means that the consumer connector can request any asset from the provider connector.

```bash
curl -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/",
             "odrl": "http://www.w3.org/ns/odrl/2/"
           },
           "@id": "aPolicy",
           "policy": {
             "@type": "set",
             "odrl:permission": [],
             "odrl:prohibition": [],
             "odrl:obligation": []
           }
         }' -H 'content-type: application/json' http://localhost:19193/management/v2/policydefinitions \
         -s | jq
```

### 5. Provider connector - Create a contract definition on Provider

To ensure an exchange between providers and consumers, the supplier must create a contract offer for
the good, on the basis of which a contract agreement can be negotiated. The contract definition
associates policies to a selection of assets to generate the contract offers that will be put in the
catalog. In this case, the selection is empty, so every asset is attached to these policies

```bash
curl -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "1",
           "accessPolicyId": "aPolicy",
           "contractPolicyId": "aPolicy",
           "assetsSelector": []
         }' -H 'content-type: application/json' http://localhost:19193/management/v2/contractdefinitions \
         -s | jq
```

Sample output:

```json
{
  ...
  "@id": "1",
  "edc:createdAt": 1674578184023,
  ...
}
```

### 6. How to fetch catalog on consumer side

In order to offer any data, the consumer can fetch the catalog from the provider, that will contain
all the contract offers available for negotiation. In our case, it will contain a single contract
offer, the so-called "catalog". To get the catalog from the consumer side, you can use the following
endpoint:

```bash
curl -X POST "http://localhost:29193/management/v2/catalog/request" \
    -H 'Content-Type: application/json' \
    -d '{
      "@context": {
        "edc": "https://w3id.org/edc/v0.0.1/ns/"
      },
      "providerUrl": "http://provider-connector:19194/protocol",
      "protocol": "dataspace-protocol-http"
    }' -s | jq
```

Sample output:

```json
{
  "@id": "31f6d748-d35b-4dec-9e34-d141fd17b458",
  "@type": "dcat:Catalog",
  "dcat:dataset": {
    "@id": "devices",
    "@type": "dcat:Dataset",
    "odrl:hasPolicy": {
      "@id": "MQ==:ZGV2aWNlcw==:NzBjNTBiNTEtNWRlOC00M2VkLThmYzItMjlmNjlmZDQ3ODI1",
      "@type": "odrl:Set",
      "odrl:permission": [],
      "odrl:prohibition": [],
      "odrl:obligation": [],
      "odrl:target": "devices"
    },
    "dcat:distribution": [
      {
        "@type": "dcat:Distribution",
        "dct:format": {
          "@id": "HttpProxy"
        },
        "dcat:accessService": "2a5178c3-c937-4ac2-85be-c46dbc6c5642"
      },
      {
        "@type": "dcat:Distribution",
        "dct:format": {
          "@id": "HttpData"
        },
        "dcat:accessService": "2a5178c3-c937-4ac2-85be-c46dbc6c5642"
      }
    ],
    "edc:name": "product description",
    "edc:id": "devices",
    "edc:contenttype": "application/json"
  },
  "dcat:service": {
    "@id": "2a5178c3-c937-4ac2-85be-c46dbc6c5642",
    "@type": "dcat:DataService",
    "dct:terms": "connector",
    "dct:endpointUrl": "http://provider-connector:19194/protocol"
  },
  "edc:participantId": "anonymous",
  "@context": {
    "dct": "https://purl.org/dc/terms/",
    "edc": "https://w3id.org/edc/v0.0.1/ns/",
    "dcat": "https://www.w3.org/ns/dcat/",
    "odrl": "http://www.w3.org/ns/odrl/2/",
    "dspace": "https://w3id.org/dspace/v0.8/"
  }
}
```

Additionally, the Federated Catalog will now also include this entry. 
This may take a couple of seconds as the federated catalog connector only polls the provider every 5 seconds as defined by "edc.catalog.cache.execution.period.seconds" in the [config](federated-authority/catalog-configuration.properties).

```bash
curl 'http://localhost:8181/api/federatedcatalog' \
    -H 'Content-Type: application/json' \
    -d '{"criteria":[]}' \
    -s | jq
```

should output something like this

```json
[
  {
    "@id": "960d2187-c845-4e1c-9f5e-8beebc83171f",
    "@type": "dcat:Catalog",
    "dcat:dataset": {
      "@id": "devices",
      "@type": "dcat:Dataset",
      "odrl:hasPolicy": {
        "@id": "MQ==:ZGV2aWNlcw==:MWFiNGIwMzYtM2Y1Ni00ZmIwLWJlNzMtYjg5YzM4MTNkMDYz",
        "@type": "odrl:Set",
        "odrl:permission": [],
        "odrl:prohibition": [],
        "odrl:obligation": [],
        "odrl:target": "devices"
      },
      "dcat:distribution": [
        {
          "@type": "dcat:Distribution",
          "dct:format": {
            "@id": "HttpProxy"
          },
          "dcat:accessService": "c3e3e29b-84c8-4322-af59-7a4c524e190e"
        },
        {
          "@type": "dcat:Distribution",
          "dct:format": {
            "@id": "HttpData"
          },
          "dcat:accessService": "c3e3e29b-84c8-4322-af59-7a4c524e190e"
        }
      ],
      "edc:name": "device models",
      "edc:id": "devices",
      "edc:contenttype": "application/n-quads"
    },
    "dcat:service": {
      "@id": "c3e3e29b-84c8-4322-af59-7a4c524e190e",
      "@type": "dcat:DataService",
      "dct:terms": "connector",
      "dct:endpointUrl": "http://provider-connector:19194/protocol"
    },
    "edc:originator": "http://provider-connector:19194/protocol",
    "edc:participantId": "provider",
    "@context": {
      "dct": "https://purl.org/dc/terms/",
      "edc": "https://w3id.org/edc/v0.0.1/ns/",
      "dcat": "https://www.w3.org/ns/dcat/",
      "odrl": "http://www.w3.org/ns/odrl/2/",
      "dspace": "https://w3id.org/dspace/v0.8/"
    }
  }
]
```

### 8. Start the workbench with the LdesClient

```bash
   docker compose up ldio-workbench -d
```

Wait for the workbench to start up properly logging "Started Application":
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldio-workbench$")
```

By now you should see a new info log line stating that the pipeline is waiting for a token.
The client will wait for a valid token before it starts consuming the LDES.
To get a token, we need to negotiate a contract and start a transfer.

### 8. Negotiate a contract

In order to request any data, a contract gets negotiated, and an agreement is resulting has to be
negotiated between providers and consumers.

The consumer now needs to initiate a contract negotiation sequence with the provider. That sequence
looks as follows:

1. Consumer sends a contract offer to the provider (__currently, this has to be equal to the
   provider's offer!__)
2. Provider validates the received offer against its own offer
3. Provider either sends an agreement or a rejection, depending on the validation result
4. In case of successful validation, provider and consumer store the received agreement for later
   reference

Of course, this is the simplest possible negotiation sequence. Later on, both connectors can also
send counter offers in addition to just confirming or declining an offer.

```bash
curl -d '{
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
   "offerId": "MQ==:ZGV2aWNlcw==:NzBjNTBiNTEtNWRlOC00M2VkLThmYzItMjlmNjlmZDQ3ODI1",
   "assetId": "devices",
   "policy": {
     "@id": "MQ==:ZGV2aWNlcw==:NzBjNTBiNTEtNWRlOC00M2VkLThmYzItMjlmNjlmZDQ3ODI1",
     "@type": "Set",
     "odrl:permission": [],
     "odrl:prohibition": [],
     "odrl:obligation": [],
     "odrl:target": "devices"
   }
  }
}' -X POST -H 'content-type: application/json' http://localhost:29193/management/v2/contractnegotiations \
-s | jq
```

Sample output:

```json
{
  ...
  "@id": "254015f3-5f1e-4a59-9ad9-bf0e42d4819e",
  "edc:createdAt": 1685525281848,
  ...
}
```

### 9. Getting the contract agreement id

After calling the endpoint for initiating a contract negotiation, we get a UUID as the response.
This UUID is the ID of the ongoing contract negotiation between consumer and provider. The
negotiation sequence between provider and consumer is executed asynchronously in the background by a
state machine. Once both provider and consumer either reach the `confirmed` or the  `declined`
state, the negotiation is finished. We can now use the UUID to check the current status of the
negotiation using an endpoint on the consumer side.

```bash
curl -X GET "http://localhost:29193/management/v2/contractnegotiations/2c549425-884e-4aeb-963b-e4e319585fcf" \
    --header 'Content-Type: application/json' \
    -s | jq
```

Sample output:

```json
{
  "@type": "edc:ContractNegotiationDto",
  "@id": "5ca21b82-075b-4682-add8-c26c9a2ced67",
  "edc:type": "CONSUMER",
  "edc:protocol": "dataspace-protocol-http",
  "edc:state": "FINALIZED",
  "edc:counterPartyAddress": "http://provider-connector:19194/protocol",
  "edc:callbackAddresses": [],
  "edc:contractAgreementId": "MQ==:ZGV2aWNlcw==:YWFjYWUzMmYtZTFlNS00Y2UxLThiNGUtNWYzNDIzMzFkOGI3",
  "@context": {
    "dct": "https://purl.org/dc/terms/",
    "edc": "https://w3id.org/edc/v0.0.1/ns/",
    "dcat": "https://www.w3.org/ns/dcat/",
    "odrl": "http://www.w3.org/ns/odrl/2/",
    "dspace": "https://w3id.org/dspace/v0.8/"
  }
}
```

### 10. Start the transfer

Now that we have a contract agreement and our client is running, 
we can finally start consuming the LDES. In the request body, we need
to specify which asset we want transferred, the ID of the contract agreement, the address of the
provider connector and where we want the file transferred. You will find the request body below.
Before executing the request, insert the contract agreement ID from the previous step. Then run :

> the "HttpProxy" method is used for the consumer pull method, and it means that it will be up to
> the consumer to request the data to the provider and that the request will be a proxy for the
> datasource

```bash
curl -X POST "http://localhost:8082/client-pipeline/transfer" \
    -H "Content-Type: application/json" \
    -d '{
        "@context": {
          "@vocab": "https://w3id.org/edc/v0.0.1/ns/"
        },
        "@type": "TransferRequest",
        "connectorId": "provider",
        "connectorAddress": "http://provider-connector:19194/protocol",
        "contractId": "MQ==:ZGV2aWNlcw==:YWFjYWUzMmYtZTFlNS00Y2UxLThiNGUtNWYzNDIzMzFkOGI3",
        "assetId": "devices",
        "protocol": "dataspace-protocol-http",
        "dataDestination": {
          "@type": "DataAddress",
          "type": "HttpProxy"
        },
        "privateProperties": {
          "receiverHttpEndpoint" : "http://ldio-workbench:8082/client-pipeline/token"
        }
    }' \
    -s | jq
```

Then, we will get a UUID in the response. This time, this is the ID of the `TransferProcess` (
process id) created on the consumer
side, because like the contract negotiation, the data transfer is handled in a state machine and
performed asynchronously.

Sample output:

```json
{
  ...
  "@id": "591bb609-1edb-4a6b-babe-50f1eca3e1e9",
  "edc:createdAt": 1674078357807,
  ...
}
```

### 11. Check the transfer status

Due to the nature of the transfer, it will be very fast and most likely already done by the time you
read the UUID.

```bash
curl http://localhost:29193/management/v2/transferprocesses/<transfer process id>
```


You should see the Transfer Process in `COMPLETED` state: 
```json
{
  ...
  "@id": "0f648d82-23b4-464d-8f7b-c89860efe7c9",
  "edc:state": "COMPLETED",
  ...
}

```

### 12. View results in the workbench logs

```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldio-workbench$")
```

# Test Teardown
To stop all systems use:
```bash
docker compose --profile connectors down
docker compose --profile delay-started down
docker compose down
```