#
# HELP
#
# Outputs the help for each task

ENV_FILE ?= env.client-persistence

include ${ENV_FILE}

USECASE_NAME ?= simulator-workflow-sink-mongo
NIFI_TOOLKIT_TAG ?= 1.17.0

.PHONY: help

help: ## This help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

build: ## Build the containers 
	@docker compose --env-file ${ENV_FILE} build

run: ## Run the containers
	echo Env file: ${ENV_FILE}
	@docker compose --env-file ${ENV_FILE} up
	@scripts/wait-for-it.sh http://localhost:9011 -q
	@curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'

stop: ## Stop the running containers
	@docker compose --env-file ${ENV_FILE} stop

toolkit: ## Run the toolkit command
	docker exec -ti ${USECASE_NAME}_ldes-workbench-nifi /opt/nifi/nifi-toolkit-current/bin/cli.sh -h

workflow: ## Upload the NiFi workflow
	docker exec -ti ${USECASE_NAME}_ldes-workbench-nifi /opt/nifi/nifi-toolkit-current/bin/cli.sh registry import-flow-version -f 7ce2fdaf9-bf81-43fa-846f-f38f6891be95 -i ./flows/nifi-workflow.json

login: ## Login to the LDES Workbench Nifi container
	@docker exec -ti ${USECASE_NAME}_ldes-workbench-nifi /bin/bash

extract: ## Extract the LDES Client state database from the docker image
	@docker exec -ti ${USECASE_NAME}_ldes-workbench-nifi /bin/bash -c 'cd /opt/nifi/nifi-current && tar -cf - *.db' | tar -xvf - -C db/
