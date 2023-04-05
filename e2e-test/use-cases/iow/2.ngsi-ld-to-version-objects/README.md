# Modify NGSI-LD to Contain Version Objects
This test validates user story **Publish IoW data using time-based fragmentation** (VSDSPUB-260) and more specific its task **Create NGSI-LD to LDES members (version objects)** (VSDSPUB-263).

IoW data contains objects of type `WaterQualityObserved`, `Device` and `DeviceModel`. The updates received (mostly `WaterQualityObserved`) represent the actual state of the objects and each subsequent update overwrites this state. In order to conform the LDES specification, an LDES contains immutable (version) objects. This test verifies the correct working of the NiFi processor that creates these version objects.

## Test Setup
For this test we can use the [Workflow](../../../support/context/workflow/README.md) context. If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Then you can run the systems by executing the following command:
```bash
docker compose up -d
```

## Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow
2. Start the NiFi workflow
3. Upload a NGSI-LD file

### 1. Upload NiFi Workflow
Browse to the [Apache NiFi user interface](https://localhost:8443/nifi) and create a new process group based on the [translate workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

The workflow contains a standard HTTP listener (ListenHTTP), the NiFi processor creating NGSI-LD version objects and a standard processor to capture the modified NGSI-LD content (PutFile).

### 2. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

Verify that the HTTP listener is working: http://localhost:9010/ngsi/healthcheck should say `OK`.

### 3. Upload a NGSI-LD File
Upload the given (or your own) NGSI-LD test file to the ListenHTTP processor:

```bash
curl -X POST http://localhost:9010/ngsi -H 'Content-Type: application/json' -d '@data/input/WaterQualityObserved.json' 
```

## Test Verification
Now, you can verify that the modified NGSI-LD by the NiFi processor contains version objects that refer to the original NGSI-LD base object.

With the default settings unchanged, the NiFi processor creates N-quads (actually N-triples) which for most people less readable. To validate the output you can use a(n online) tool such as [EasyRDF Convertor](https://www.easyrdf.org/converter) to format the output to the more readable Turtle format:
* goto https://www.easyrdf.org/converter
* copy/paste the N-triples output to the `Input Data:` field
* change the input format to `N-triples`
* choose the `Turtle Terse RDF Triple Language` output format
* choose `Submit`

The online tool results in output similar to (only showing relevant properties):
```
@prefix ns0: <https://uri.etsi.org/ngsi-ld/default-context/> .
@prefix ns1: <https://uri.etsi.org/ngsi-ld/> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<urn:ngsi-v2:cot-imec-be:WaterQualityObserved:dwg-iow-886nJGdroD857YjumSEuNj/2022-09-09T09:10:00.000Z>
...
  dc:isVersionOf <urn:ngsi-v2:cot-imec-be:WaterQualityObserved:dwg-iow-886nJGdroD857YjumSEuNj> ;
...
  prov:generatedAtTime "2022-09-09T09:10:00.000Z"^^xsd:dateTime ;
...
  a ns0:WaterQualityObserved ;
...
```

> **Note**: that a version object is created with its ID based on the `dateObserved.hasValue` value, which is defined as `https://uri.etsi.org/ngsi-ld/DateTime`.

> **Note**: because of this custom type, the NiFi processor can also adds a property `prov:generatedAtTime` which by definition has range `http://www.w3.org/2001/XMLSchema#dateTime`. Adding this property is recommended by LDES, however The NiFi processor can be instructed to omit this property if not needed.

> **Note**: that the verson object refers to its base (state) object using `dc:isVersionOf` having a simple IRI as its value.

## Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems, i.e.:
```bash
docker compose down
```
