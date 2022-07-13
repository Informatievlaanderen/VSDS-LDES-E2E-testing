# syntax=docker/dockerfile:1

#
# INSTALL nifi
#

ARG NIFI_STAGE_MAVEN
ARG NIFI_STAGE_NIFI

FROM ${NIFI_STAGE_MAVEN:-maven:3.8.6-openjdk-18} AS builder
FROM ${NIFI_STAGE_NIFI:-agturley/nifi:1.16.3-bd-jdk17} as nifi

# MAVEN: install
FROM builder as build-stage
WORKDIR /nifi-processors-bundle
ARG NIFI_BUILD_DIR
COPY ${NIFI_BUILD_DIR} .
RUN mvn install

# NIFI: setup nar
FROM nifi
WORKDIR /opt/nifi/nifi-current
COPY --from=build-stage /nifi-processors-bundle/ldes-processors/target/*.nar ./lib/

# NIFI: configure
ARG NIFI_CONF_DIR
COPY ${NIFI_CONF_DIR}/ /opt/nifi/nifi-current/conf_template/
