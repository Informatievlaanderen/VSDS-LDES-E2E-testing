#!/usr/bin/env bash

function get_access_token() {
    # echo "Requesting access token with username '${SINGLE_USER_CREDENTIALS_USERNAME}' and password '${SINGLE_USER_CREDENTIALS_PASSWORD}'"

    ACCESS_TOKEN=$(curl -s -k "${NIFI_API}/access/token" -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: */*' --data "username=${SINGLE_USER_CREDENTIALS_USERNAME}&password=${SINGLE_USER_CREDENTIALS_PASSWORD}" --compressed)
}

function get_process_groups() {
    RESULT=$(curl -s -k "${NIFI_API}/process-groups/root/process-groups" -H 'Accept-Encoding: gzip, deflate, sdch, br' -H "Authorization: Bearer ${ACCESS_TOKEN}" -H 'Accept: application/json, text/javascript, */*; q=0.01' --compressed)

    echo $(echo $RESULT)
}

function delete_process_group() {
    PROCESS_GROUP_ID=$1
    PROCESS_GROUP_VERSION=$2

    stop_process_group $PROCESS_GROUP_ID

    RESULT=$(curl -s -k -X DELETE "${NIFI_API}/process-groups/${PROCESS_GROUP_ID}?version=${PROCESS_GROUP_VERSION}" -H "Authorization: Bearer ${ACCESS_TOKEN}")
    echo $(echo $RESULT)
}

function find_process_groups() {
    PROCESS_GROUP_NAME=$1
    PROCESS_GROUPS=$(get_process_groups)
    echo $(echo $PROCESS_GROUPS | jq -c ".processGroups[] | select(.component.name == \"$PROCESS_GROUP_NAME\") | [.id, .revision.version]" | tr -d '"')
}

function remove_process_group_if_exists() {
    PROCESS_GROUP_NAME=$1
    PROCESS_GROUPS=[]

    RESULT=$(find_process_groups $PROCESS_GROUP_NAME)
    IFS=" " read -r -a PROCESS_GROUPS <<< "$RESULT"
    for PROCESS_GROUP in "${PROCESS_GROUPS[@]}"; do
        PROCESS_GROUP=$(echo $PROCESS_GROUP | tr -d '[]')
        IFS="," read -r -a PROCESS_GROUP_DATA <<< $PROCESS_GROUP
        RESULT=$(delete_process_group ${PROCESS_GROUP_DATA[0]} ${PROCESS_GROUP_DATA[1]})
    done
}

function load_flow_file() {
    PROCESS_GROUP_DEFINITION=`cat $PROCESS_GROUP_JSON`
    
    PROCESS_GROUP_DEFINITION=$(echo ${PROCESS_GROUP_DEFINITION} |\
        jq "(.versionedFlowSnapshot.flowContents.processors[] | select(.name==\"InvokeHTTP\")).properties.\"Remote URL\"|=\"${LDES_CLIENT_SINK_URL}\"" | \
        jq "(.versionedFlowSnapshot.flowContents.processors[] | select(.name==\"LdesClient\")).properties.\"DATASOURCE_URL\"|=\"${LDES_SERVER_SIMULATOR_URL}\"")
    echo $(echo $PROCESS_GROUP_DEFINITION)
}

function create_process_group() {
    remove_process_group_if_exists $PROCESS_GROUP_NAME

    PROCESS_GROUP_DEFINITION=$(load_flow_file)

    RESULT=$(curl -s -k "${NIFI_API}/process-groups/root/process-groups" -H "Authorization: Bearer ${ACCESS_TOKEN}" -H 'Content-Type: application/json' -d "${PROCESS_GROUP_DEFINITION}")
    echo $(echo "$RESULT" | jq '.id' | tr -d '"')
}

function start_process_group() {
    PROCESS_GROUP_ID=$1
    FLOW_COMMAND="{\"id\":\"${PROCESS_GROUP_ID}\",\"state\":\"RUNNING\"}"

    RESULT=$(curl -s -k -X PUT "${NIFI_API}/flow/process-groups/${PROCESS_GROUP_ID}" -H "Authorization: Bearer ${ACCESS_TOKEN}" -H 'Content-Type: application/json' -d ${FLOW_COMMAND})
    echo $(echo $RESULT)
}

function stop_process_group() {
    PROCESS_GROUP_ID=$1
    FLOW_COMMAND="{\"id\":\"${PROCESS_GROUP_ID}\",\"state\":\"STOPPED\"}"

    RESULT=$(curl -s -k -X PUT "${NIFI_API}/flow/process-groups/${PROCESS_GROUP_ID}" -H "Authorization: Bearer ${ACCESS_TOKEN}" -H 'Content-Type: application/json' -d ${FLOW_COMMAND})
    echo $(echo $RESULT)
}

function create_and_start_process_group() {
    PROCESS_GROUP_ID=$(create_process_group)
    FLOW_COMMAND="{\"id\":\"${PROCESS_GROUP_ID}\",\"state\":\"RUNNING\"}"
    
    RESULT=$(curl -s -k -X PUT "${NIFI_API}/flow/process-groups/${PROCESS_GROUP_ID}" -H "Authorization: Bearer ${ACCESS_TOKEN}" -H 'Content-Type: application/json' -d ${FLOW_COMMAND})
    echo $(echo $RESULT)
}

get_access_token