# Translate NGSI-v2 to NGSI-LD
This test validates user story **Publish IoW data using time-based fragmentation** (VSDSPUB-260) and more specific its task **Create NiFi processor translating NGSI-v2 to NGSI-LD** (VSDSPUB-262).

The NiFi processor implements the following algorithm (taken from [here](https://fiware-datamodels.readthedocs.io/en/stable/ngsi-ld_howto/index.html#steps-to-migrate-to-json-ld)):
* NGSI v2 entity `id` attributes have to be converted to URIs, preferably using the NGSI-LD URN
* Regular entity attributes have to be converted to JSON-LD nodes of type `Property`.
* `ref` attributes (pointing to other entities) have to be converted to JSON-LD nodes of type `Relationship`.
* The `timestamp` metadata item has to be mapped to the observedAt member of a `Property` node.
* The `unitCode` metadata item has to be mapped to the `unitCode` member of a Property node.
* The NGSI v2 `DateTime` type has to be properly encoded as per the JSON-LD rules.
* The NGSI v2 `geo:json` type has to be renamed to `GeoProperty`.

## Test Setup
For this test we can use the [Workflow](../../../support/context/workflow/README.md) context. Please copy the [environment file (env.translate)](./env.translate) to a personal file (e.g. `env.user`) and fill in the mandatory arguments.

Yyou can change the location of generated files containing the NGSI-LD output.

> **Note**: make sure to verify the settings in your personal `env.user` file to contain the correct file paths, relative to your system or the container where appropriate, etc. Also ensure that the file paths actually exist, if not, create then.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/workflow/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/workflow/docker-compose.yml"
```

> **Note**: because of the way Docker and Docker Compose work, it is best to pass the volume mapped location by creating an environment variable, e.g.:
```bash
export NIFI_DATA_FOLDER=$(pwd)/data/output
```

Then you can run the systems by executing the following command:
```bash
docker compose --env-file env.user up
```

## Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow
2. Start the NiFi workflow
3. Upload a NGSI-v2 file
4. Generate expected NGSI-LD file

### 1. Upload NiFi Workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [translate workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

The workflow contains a standard HTTP listener (ListenHTTP), the NGSI-v2 to NGSI-LD translator and a standard processor to capture the NGSI-LD content (PutFile).

> **NOTE**: currently the NGSI-v2 to NGSI-LD translator does not yet exist and as such the workflow template does not yet contain it!

You can verify the processor settings to ensure the HTTP listener listens on the correct port and path (e.g. http://localhost:9010/ngsi), etc.

### 2. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

Verify that the HTTP listener is working: http://localhost:9010/ngsi/healthcheck should say `OK`.

### 3. Upload a NGSI-v2 File
Upload the given (or your own) NGSI-v2 test file to the ListenHTTP processor:

```bash
curl -X POST http://localhost:9010/ngsi -H 'Content-Type: application/json' -d '@data/input/WaterQualityObserved.json' 
```

### 4. Generate Expected NGSI-LD File
While waiting for the workflow to translate the NGSI-v2 file to the NGSI-LD become available in the mapped volume, you can use Fiware's NGSI-v2 to NGSI-LD [python script](https://github.com/FIWARE/data-models/blob/master/tools/normalized2LD.py) to generate the expected output.

The script relies on a package (`entity_print`) that cannot be found anymore so we have adapted the script to use a standard method for printing an entity to json (`json.dumps`). You can find the adapted script [here](./normalized2LD.py).

Please make sure you have installed [Python 3.x](https://www.python.org/downloads/) and the Python package manager ([pip](https://pypi.org/project/pip/)). E.g.:

* verify your python installation: `py --version`
* verify your pip installation: `pip --version`
* if needed, install and upgrade pip: `py -m pip install --upgrade pip`

Install the script dependencies:
```bash
pip install rfc3987
```

Checking the script without providing arguments (i.e. `py ./normalized2LD.py`) results in:
```text
Usage: normalized2LD [input file] [output file] [target ld_context]
```
Convert the NGSI-v2 to NGSI-LD using the script. E.g.:
```bash
py ./normalized2LD.py ./data/input/WaterQualityObserved.json ./data/expected/WaterQualityObserved.json \
                      https://github.com/smart-data-models/dataModel.WaterQuality/blob/master/context.jsonld
```

## Test Verification
Now, you can verify that the generated NGSI-LD by the NiFi processor matches the one generated by the python script. 

> **Note**: that because a JSON file can be formatted in various ways, a simple text comparison might not provide the desired results. A possible approach is an online JSON compare tool such as https://www.jsondiff.com/. Alternatively, convert both JSON files to N-quad files, sort the content of the files and compare these results.
