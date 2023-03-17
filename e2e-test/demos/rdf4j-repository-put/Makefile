#
# HELP
#
# Outputs the help for each task

ENV_FILE ?= .env

include ${ENV_FILE}

USECASE_NAME ?= rdf4j-repository-put

.PHONY: help

help: ## This help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

build: ## Build the containers 
	@docker compose --env-file ${ENV_FILE} build

run: ## Run the containers
	@echo Env file: ${ENV_FILE}
	@docker compose --env-file ${ENV_FILE} up -d

stop: ## Stop the running containers
	@docker compose --env-file ${ENV_FILE} down

login: ## Login to the LDES Workbench Nifi container
	@docker exec -ti ${USECASE_NAME}_ldes-workbench-nifi /bin/bash
