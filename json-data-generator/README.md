# JSON Data Generator
For the Internet of Water (IoW) use case, the Vlaamse Milieu Maatschappij (VMM) uses an [Orion Context Broker](https://fiware-orion.readthedocs.io/en/master/) to send [WaterQualityObserved object](https://fiware-datamodels.readthedocs.io/en/stable/Environment/WaterQualityObserved/doc/spec/index.html) updates to the systems which have an active [NGSI-v2 subscription](https://fiware.github.io/specifications/ngsiv2/stable/).

This little component can act as a simple replacement for this broker and allows to send on regular time intervals some JSON data, based on a template that gets altered before sending based on a mapping.

## Docker
> TODO

## Build the Generator
The generator is implemented as a [Node.js](https://nodejs.org/en/) application.
You need to run the following commands to build it:
```bash
npm i
npm run build
```

## Run the Generator
The generator works based on a JSON template, defining the structure to use for each generated item, and a JSON mapping file, defining the transformations that need to be performed on the template. It can send the generated JSON data to a target URL or simply send it to the console.

The generator takes the following command line arguments:
* `--silent=<true|false>` prevents any console debug output if true, defaults to false (not silent, logging all debug info)
* `--targetUrl` defines the target URL to where the generated JSON is POST'ed as `application/json`, no default (if not provided, sends output to console independant of `--silent`)
* `--cron` defines the time schedule, defaults to `* * * * * * ` (every second)
* `--template='<json-content>'` allows to provide the JSON template on the command line, no default (if not provided, you MUST provide `--templateFile`)
* `--templateFile=<partial-or-full-pathname>` allows to provide the JSON template in a file, no default (if not provided, you MUST provide `--template`)
* `--mapping='<json-content>'` allows to provide the JSON mapping on the command line, no default (if not provided, you MUST provide `--mappingFile`)
* `--mappingFile=<partial-or-full-pathname>` allows to provide the JSON mapping in a file, no default (if not provided, you MUST provide `--mapping`)

The template or template file should simply contain a valid JSON structure (with one or more JSON objects). E.g.:
```json
[
    { "id": "my-id", "type": "Something", "modifiedAt": "2022-09-09T09:10:00.000Z" },
    { "id": "my-other-id", "type": "SomethingElse", "modifiedAt": "2022-09-09T09:10:00.000Z" }
]
```

The mapping file is also a JSON file but uses a key/value mapping where the key conforms the [JSON path specifications](https://datatracker.ietf.org/doc/id/draft-goessner-dispatch-jsonpath-00.html) and the value conforms a syntax allowing to change the value matched by the JSON path to a new value obtained by replacing the variables specified in the value part, e.g.:
```json
{ "$..id": "${@}-${nextCounter}", "$..modifiedAt": "${currentTimestamp}" }
```

The `${@}` will be replaced by the currently match value of the JSON path `$.id` (e.g. `my-id`) while any other `${<property>}` will use a property of the generator itself. Currently the only allowed properties are:
* `nextCounter`: increasing integer value, starting from 1
* `currentTimestamp`: current date and time formatted as [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) in UTC (e.g. `2007-04-05T14:30:00.000Z`)

You can run the generator after building it, e.g.:

Using this [template](./data/other.template.json) and this [mapping](./data//other.mapping.json) and with silent output to console:
```bash
node ./dist/index.js --templateFile ./data/other.template.json --mappingFile ./data/other.mapping.json --silent
```
This results in something like the following:
```
{"id":"my-id-1","type":"Something","modifiedAt":"2022-09-12T13:15:42.009Z"}
{"id":"my-id-2","type":"Something","modifiedAt":"2022-09-12T13:15:43.003Z"}
{"id":"my-id-3","type":"Something","modifiedAt":"2022-09-12T13:15:44.003Z"}
...
```
By specifying the template (containing multiple objects) and mapping on the command file:
```bash
node ./dist/index.js --template '[{"id": "my-id", "type": "Something", "modifiedAt": "2022-09-09T09:10:00.000Z" },{ "id": "my-other-id", "type": "SomethingElse", "modifiedAt": "2022-09-09T09:10:00.000Z" }]' --mapping '{ "$..id": "${@}-${nextCounter}", "$..modifiedAt": "${currentTimestamp}" }' --silent
```
This results in something like:
```json
[{"id":"my-id-1","type":"Something","modifiedAt":"2022-09-12T13:44:12.010Z"},{"id":"my-other-id-2","type":"SomethingElse","modifiedAt":"2022-09-12T13:44:12.010Z"}]
[{"id":"my-id-3","type":"Something","modifiedAt":"2022-09-12T13:44:13.005Z"},{"id":"my-other-id-4","type":"SomethingElse","modifiedAt":"2022-09-12T13:44:13.005Z"}]
[{"id":"my-id-5","type":"Something","modifiedAt":"2022-09-12T13:44:14.004Z"},{"id":"my-other-id-6","type":"SomethingElse","modifiedAt":"2022-09-12T13:44:14.004Z"}]
...
```

Alternatively you can generate the output using a different time schedule (e.g. every 2 seconds) to a [dummy HTTP server](https://docs.webhook.site/) (including debugging to the console):
```bash
node ./dist/index.js --templateFile ./data/other.template.json --mappingFile ./data/other.mapping.json --cron '*/2 * * * * *' --targetUrl https://webhook.site/28dba053-5bc2-4934-9cd8-0541012470a5
```
This results in:
```json
data template:  { "id": "my-id", "type": "Something", "modifiedAt": "2022-09-09T09:10:00.000Z" }
Mapping:  {
  '$.id': '${@}-${nextCounter}',
  '$.modifiedAt': '${currentTimestamp}'
}
Runs at:  */2 * * * * *
Sending:  {"id":"my-id-1","type":"Something","modifiedAt":"2022-09-12T13:23:58.017Z"}
Next run at:  2022-09-12T15:24:00.000+02:00
Sending:  {"id":"my-id-2","type":"Something","modifiedAt":"2022-09-12T13:24:00.004Z"}
Next run at:  2022-09-12T15:24:02.000+02:00
Sending:  {"id":"my-id-3","type":"Something","modifiedAt":"2022-09-12T13:24:02.003Z"}
Next run at:  2022-09-12T15:24:04.000+02:00
...
```
