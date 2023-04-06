# Convert Water Quality NGSI to OSLO Model
This test verifies the convertion towards OSLO models, more specific, it demonstrates converting the [NGSI water quality model](https://github.com/smart-data-models/dataModel.WaterQuality) into its [OSLO model](https://data.vlaanderen.be/standaarden/kandidaat-standaard/vocabularium-en-applicatieprofiel-oslo-waterkwaliteit.html).

The test uses a similar setup as the [NGSI-v2 to NGSI-LD conversion test](../3.ngsi-v2-to-ldes/README.md) but adds an additional component in the Apache NiFi workflow to convert the NGSI-LD to the OSLO model. This conversion happens after converting the incoming NGSI-v2 model to the NGSI-LD model and before creating a version object and sending that to an LDES server.

The conversion from NGSI-LD to OSLO is a JSON-to-JSON format conversion and can be done using a standard Apache NiFi component ([JOLT](https://jolt-demo.appspot.com/#inception) transform [processor](https://nifi.apache.org/docs/nifi-docs/components/org.apache.nifi/nifi-standard-nar/1.17.0/org.apache.nifi.processors.standard.JoltTransformJSON/index.html)).


## Test Setup
To setup this test, you need to configure your environment file, launch the systems and verify the initial state.

### Configure Environment File
If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

### Launch Systems
You can start all the required systems except for the observations generator using command:
```bash
docker compose up -d
```
> **Note**: it may take a minute for all the servers to start.

### Verify Initial State
Once the LDES servers are launched, you can verify that the initial LDES'es are empty:
```bash
curl http://localhost:8072/device-models/by-time
curl http://localhost:8071/devices/by-time
curl http://localhost:8073/water-quality-observations/by-time
```
returns:
```
@prefix device-models: <http://localhost:8072/device-models/> .
@prefix ldes:          <https://w3id.org/ldes#> .
@prefix prov:          <http://www.w3.org/ns/prov#> .
@prefix terms:         <http://purl.org/dc/terms/> .
@prefix tree:          <https://w3id.org/tree#> .

<http://localhost:8072/device-models>
        a                   ldes:EventStream ;
        ldes:timestampPath  prov:generatedAtTime ;
        ldes:versionOfPath  terms:isVersionOf ;
        tree:view           device-models:by-time .

device-models:by-time
        a       tree:Node .

----------------------------------------------------------

@prefix devices: <http://localhost:8071/devices/> .
@prefix ldes:    <https://w3id.org/ldes#> .
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix terms:   <http://purl.org/dc/terms/> .
@prefix tree:    <https://w3id.org/tree#> .

devices:by-time  a  tree:Node .

<http://localhost:8071/devices>
        a                   ldes:EventStream ;
        ldes:timestampPath  prov:generatedAtTime ;
        ldes:versionOfPath  terms:isVersionOf ;
        tree:view           devices:by-time .

----------------------------------------------------------

@prefix ldes:                       <https://w3id.org/ldes#> .
@prefix prov:                       <http://www.w3.org/ns/prov#> .
@prefix terms:                      <http://purl.org/dc/terms/> .
@prefix tree:                       <https://w3id.org/tree#> .
@prefix water-quality-observations: <http://localhost:8073/water-quality-observations/> .

<http://localhost:8073/water-quality-observations>
        a                   ldes:EventStream ;
        ldes:timestampPath  prov:generatedAtTime ;
        ldes:versionOfPath  terms:isVersionOf ;
        tree:view           water-quality-observations:by-time .

water-quality-observations:by-time
        a       tree:Node .
```

## Test Execution
In order to execute the test, you need to load & configure a workflow and send some test data.

### Load & Configure Workflow
Please logon to the Apache Nifi system at https://localhost:8443/nifi and add the [workflow](./nifi-workflow.json) (see [here](../../../support/context/workflow/README.md#creating-a-workflow) for details).

We have already added the provided JOLT specifications for [models](./data/transforms/device-model.jolt-transform.json), [devices](./data/transforms/device.jolt-transform.json) and water quality [observations](./data/transforms/wqo.jolt-transform.json) into the correct JOLT processor's `Jolt Specification` property.

In addition, for the observations we added the [JOLT specification to add a WKT](./data/transforms/asWkt.jolt-transform.json) as the second JOLT transform because the OSLO model can not handle geojson.

Start the workflow and verify that the workflow's HTTP listeners are ready to accept entities.
* http://localhost:9013/ngsi/device-model/healthcheck
* http://localhost:9012/ngsi/device/healthcheck
* http://localhost:9014/ngsi/water-quality-observed/healthcheck

### Send Test Data
To send a test model and a test device execute the following commands:
```bash
curl -X POST http://localhost:9013/ngsi/device-model -H 'Content-Type: application/json' -d '@data/device-model.json' 
curl -X POST http://localhost:9012/ngsi/device -H 'Content-Type: application/json' -d '@data/device.json' 
```

To send a few water quality observations, briefly start the observations generator (type `CTRL-C` to stop it):
```bash
docker compose up json-data-generator -d
```

## Test Validation
To validate that the LDES'es contain the correct OSLO models, you can retrieve the LDES views and follow the relations.
```bash
curl http://localhost:8072/device-models/by-time
curl http://localhost:8071/devices/by-time
curl http://localhost:8073/water-quality-observations/by-time
```

## Test Cleanup
To clean up the test, please stop all systems:
```bash
docker compose stop json-data-generator
docker compose --profile delay-started down
```
