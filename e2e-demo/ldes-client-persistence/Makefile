#
# HELP
#
# Outputs the help for each task

include pyldes.env

.PHONY: help

help: ## This help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

build: ## Build the containers (with env file pyldes.env)
	@docker compose --env-file ./pyldes.env build

	@if [ -n ${INITIALISE_DB_ON_BUILD} ] && [ ${INITIALISE_DB_ON_BUILD} = "true" ]; then \
		docker compose --env-file ./pyldes.env up & \
		./scripts/wait-for-it.sh localhost:5000 -q; \
		./scripts/wait-for-it.sh localhost:9432 -q; \
		sleep 5s; \
		curl --request GET --url http://localhost:5000/manage/init; \
		curl -X POST  -d "@data/initial.ttl" -H "Content-Type: text/turtle" -H "Accept: text/turtle" localhost:5000/ldes; \
		docker compose --env-file ./pyldes.env stop; \
	fi

run: ## Run the containers (with env file pyldes.env)
	@docker compose --env-file ./pyldes.env up

stop: ## Stop the running containers
	@docker compose stop
