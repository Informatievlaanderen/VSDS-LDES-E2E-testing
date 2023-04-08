# E2E Tests
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
By default, the automatic tests are run against the latests docker images but you can specify to use a different set of tags. These are typically the tags of the docker images of the previous sprint. To use your tags you need to add an environment variable which refers to a custom .env file (`--env useTags=<full-or-partial-path-to-user-env>`):
```bash
npm run test -- --env useTags="./previous-tags.env"
```

### Run All Tests
To run all tests run one of the following :
```bash
# run one of these commands (all equivalent):
npm run test:all
npm run test
npm test
```

### Run Partial Test Set
To run a part of the tests you can provide a feature file (or a collection of feature files using wildcards):
```bash
npm run test:one -- cypress/e2e/caching*.feature
```

If you want to run one feature file containing a few related tests with custom tags you can use the following syntax:
```bash
npm run test:one -- cypress/e2e/caching.feature --env useTags="./previous-tags.env"
```
