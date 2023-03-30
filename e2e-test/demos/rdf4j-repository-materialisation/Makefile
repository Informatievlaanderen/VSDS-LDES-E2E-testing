#
# HELP
#
# Outputs the help for each task

ENV_FILE ?= .env

include ${ENV_FILE}

USECASE_NAME ?= rdf4j-repository-materialisation

.PHONY: help

help: ## This help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

run: ## Run the containers
	@echo Env file: ${ENV_FILE}
	@docker compose --env-file ${ENV_FILE} up -d

stop: ## Stop the running containers
	@docker compose --env-file ${ENV_FILE} down

login-nifi: ## Login to the NiFi Workbench container
	@docker exec -ti ${USECASE_NAME}-ldi-workbench-nifi /bin/bash

log-nifi: ## Tail the NiFi docker logs
	@docker logs --follow ${USECASE_NAME}-ldi-workbench-nifi

login-rdf4j: ## Login to the NiFi Workbench container
	@docker exec -ti ${USECASE_NAME}-rdf4j-server /bin/bash

log-rdf4j: ## Tail the RDF4J docker logs
	@docker logs --follow ${USECASE_NAME}-rdf4j-server

seed: ## Seed the nifi data dir with initial data
	@cp -pR data/add/* nifi/

update: ## Add a data file containing a change to the nifi data dir
	@cp -pR data/update/* nifi/

query: ## Query the test record
	@curl http://localhost:8080/rdf4j-server/repositories/test?query=select%20%3Fgiven_name%20where%20%7B%20%3Chttp%3A%2F%2Fsomewhere%2FTaylorKennedy%2F%3E%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2Fvcard-rdf%2F3.0%23N%3E%20%3Fid%20.%20%3Fid%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2Fvcard-rdf%2F3.0%23Given%3E%20%3Fgiven_name%20%7D -H "Accept: application/sparql-results+json"
	
