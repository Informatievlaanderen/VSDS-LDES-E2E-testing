#!/bin/bash
CWD=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

# find latest LDI NiFi processors version
LDI_PROCESSORS_GROUPID=be.vlaanderen.informatievlaanderen.ldes.ldi.nifi
LDI_PROCESSORS_ARTIFACT=ldi-processors-bundle
LDI_REPOSITORY_SERVICES=https://s01.oss.sonatype.org/service/local
LDI_REPOSITORY_METASEARCH=${LDI_REPOSITORY_SERVICES}/lucene/search
LDI_PROCESSORS_METADATA=$(curl -s "${LDI_REPOSITORY_METASEARCH}?g=${LDI_PROCESSORS_GROUPID}&a=${LDI_PROCESSORS_ARTIFACT}" -H "accept: application/json")

# export version for envsubst below
export LDI_PROCESSORS_VERSION=$(echo $LDI_PROCESSORS_METADATA | jq '.data[0].latestSnapshot' | tr -d '"')

# find LDI NiFi processors bundle download location
LDI_REPOSITORY_PATHSEARCH=${LDI_REPOSITORY_SERVICES}/artifact/maven/resolve
LDI_PROCESSORS_PATHDATA=$(curl -s "${LDI_REPOSITORY_PATHSEARCH}?r=snapshots&g=${LDI_PROCESSORS_GROUPID}&a=${LDI_PROCESSORS_ARTIFACT}&v=${LDI_PROCESSORS_VERSION}&c=nar-bundle&e=jar&isLocal=true" -H "accept: application/json")
LDI_PROCESSORS_PARTIALPATH=$(echo $LDI_PROCESSORS_PATHDATA | jq '.data.repositoryPath' | tr -d '"')
LDI_REPOSITORY_BASE=$(echo $LDI_PROCESSORS_METADATA | jq '.repoDetails[0].repositoryURL' | tr -d '"')
LDI_PROCESSORS_SNAPSHOT_URL="${LDI_REPOSITORY_BASE}/content${LDI_PROCESSORS_PARTIALPATH}?describe=info&isLocal=true"
LDI_PROCESSORS_SNAPSHOT_INFO=$(curl -s "$LDI_PROCESSORS_SNAPSHOT_URL" -H "accept: application/json")
LDI_PROCESSORS_BUNDLE_URI=$(echo $LDI_PROCESSORS_SNAPSHOT_INFO | jq '.data.repositories[0].artifactUrl' | tr -d '"')

# download and unpack the NAR files
LDI_PROCESSORS_BUNDLE_ARCHIVE=$CWD/temp/ldi-processors-bundle.jar
curl -s $LDI_PROCESSORS_BUNDLE_URI --output $LDI_PROCESSORS_BUNDLE_ARCHIVE
cd $CWD/temp && unzip -q -j $LDI_PROCESSORS_BUNDLE_ARCHIVE *.nar
rm $LDI_PROCESSORS_BUNDLE_ARCHIVE

# create workflow definition from template
WORKFLOW_DEFINITION=$CWD/nifi-workflow.json
envsubst < $CWD/workbench/template.json > $WORKFLOW_DEFINITION

# launch all systems
LOCALHOST=$(hostname)
export HOSTNAME=${HOSTNAME:-$LOCALHOST}
docker compose up -d --wait

# configure the server
sh $CWD/server/seed.sh

# generate client ID
CLIENT=$(uuidgen)

# export all docker environment variables
export $(grep -v '^#' $CWD/.env | xargs)

# request access token
TOKEN=`curl -s -k -X POST "https://localhost:8443/nifi-api/access/token" -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "username=$NIFI_USER" --data-urlencode "password=$NIFI_PWD"` && export TOKEN

# upload the workflow
WORKFLOW=`curl -s -k -X POST "https://localhost:8443/nifi-api/process-groups/root/process-groups/upload" -H "Authorization: Bearer $TOKEN" -F "groupName=\"nifi-workflow\"" -F "positionX=\"0\"" -F "positionY=\"0\"" -F "clientId=\"$CLIENT\"" -F "file=@\"$WORKFLOW_DEFINITION\""` && export WORKFLOW

# delete the workflow definition
rm $WORKFLOW_DEFINITION

# extract workflow uri and id
WORKFLOW_URI=`echo $WORKFLOW | egrep -i 'https[^"]+' -o` && export WORKFLOW_URI
WORKFLOW_ID=`echo $WORKFLOW_URI | egrep -i '[^/]+$' -o` && export WORKFLOW_ID

# start the workflow
curl -s -k -X PUT "https://localhost:8443/nifi-api/flow/process-groups/$WORKFLOW_ID" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"id\":\"$WORKFLOW_ID\",\"state\":\"RUNNING\"}"

# check NiFi HTTP listener is ready
READY='' && while [ "$READY" = "OK" ] ; do sleep 1; READY=$(curl -f -s http://localhost:9005/observations/healthcheck); done
