# E2E Tests - Sprint 51
These following end-to-end tests currently exist:
* [Manual Tests](./tests)
* [Demos](./demos) (not yet automated) -- gradually automated and moved to [Manual Tests](./tests)

> **Note**: all the tests use [Docker](http://www.docker.io) as a container technology, and therefore some knowledge is required.

## Test Automation
The E2E tests are gradually being automated using [cypress](https://www.cypress.io/) but with a layer of [cucumber](https://cucumber.io/) and on top that allows writing the tests in a more [natural language](https://en.wikipedia.org/wiki/Cucumber_(software)). The steps in the test scenarios are implemented using [typescript](https://www.typescriptlang.org/) and run in a [Node.js](https://nodejs.org/) environment.

### Get Dependencies
Before the tests can be run, you need to retrieve the required dependencies:
```bash
npm i
```

### Get Docker Images
In addition, you need to retrieve the docker images that will be used in the automated tests. You can use the supplied scripts to retrieve the [docker images from the previous sprint](./get-previous-docker-images.sh) or the [latest docker images](./get-latest-docker-images.sh):
```bash
# run one or both of these scripts:
./get-previous-docker-images.sh
./get-latest-docker-images.sh
```

### Use Custom Docker Compose Tags
By default, the automatic tests are run against the latests docker images but you can specify to use a different set of tags. These are typically the tags of the docker images of the previous sprint. To use your tags you need to add an environment variable which refers to a custom .env file (`--env userEnv=<full-or-partial-path-to-user-env>`):
```bash
npm run test -- --env userEnv="./previous-tags.env"
```

### Run Tests
To run the tests we use [cypress](https://www.cypress.io) from the command line. For more details, see:
```bash
./node_modules/cypress/bin/cypress run --help
```
As you can see, many options can be provided, but none are required to execute all tests.

#### Run All Tests
To run all tests, simply use the cypress `run` command:
```bash
./node_modules/cypress/bin/cypress run
```
In addition for your convenience we have provided a `npm` script which also allows to run all tests (excluding temporary broken ones):
```bash
npm run test
```
or even shorter:
```bash
npm test
```

#### Run Partial Test Set
If you do not want to run all tests, you can limit the tests by specifying one or more feature files or by using a combination of tags.

> **Note**: we have organized the tests by tagging all features, scenarios and scenario outlines as well as some examples. This allows you to specify one or more tests in a logical way. One set of tags is especially handy to limit the test set to a particular LDES workbench: `@ldio` is used for all tests using the LDIO workbench and `@nifi` is used for the tests using the NiFi workbench. Some tests are written as a scenario outline providing these two workbenches as tagged examples.

To run all tests only using the LDIO or the NiFi workbench use can use the following:
```bash
npm run test:no-nifi
npm run test:no-ldio
```

To run a part of the tests by limiting the set of feature files, you can specify one feature file or a collection of feature files using wildcards or comma separated, e.g. (best to specify the fature):
```bash
npm test -- -s "cypress/e2e/client.basics.feature"
npm test -- -s "cypress/e2e/client.basics.feature,cypress/e2e/server.basics.feature"
npm test -- -s "cypress/e2e/server.*.feature"
```
To run a subset of the test bed you can also specify a [tag or tag expression](https://cucumber.io/docs/cucumber/api/?lang=javascript#tags):
```bash
npm test -- -e tags="@test-001"
npm test -- -e tags="@server and not (@performance or @retention)"
```
or, if you know in which feature files the tests are located to limit the search you can also use:
```bash
npm test -- -e tags="@test-001" -s "cypress/e2e/client.basics.feature"
npm test -- -e tags="@server and not (@performance or @retention)" -s "cypress/e2e/server.*.feature"
```

> **Note**: that because you can only specify one `--env` [setting](https://docs.cypress.io/guides/guides/environment-variables#Option-4---env) on the command line you need to repeat the `-e tags="not @BROKEN"`, e.g.:
> ```bash
> npm test -- -e tags="@server and not (@performance or @retention) and not @BROKEN" -s "cypress/e2e/server.*.feature"
> ```

All the manual tests have their docker compose file configured to run with the latest available images. As mentioned [before](#get-docker-images), you need to manually get these images. Alternatively you can configure the automated tests to use a different set of images by passing a file similar to [this one](./previous-tags.env) and providing the `userEnv` environment variable.

> **Note**: please do not confuse the image tags with the cypress tests tags. 

If you want to run one feature file containing a few related tests with custom tags you can use the following syntax:
```bash
npm test -- -e userEnv="./previous-tags.env",tags="not @BROKEN"
```
or
```bash
export cypress_userEnv="./previous-tags.env"
npm test
```

> **Note**: you can also provide other docker compose file variables in the `userEnv` file, not only image tags.
