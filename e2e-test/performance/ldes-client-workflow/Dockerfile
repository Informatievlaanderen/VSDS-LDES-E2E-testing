# syntax=docker/dockerfile:1

#
# INSTALL nifi
#

ARG NIFI_STAGE_MAVEN
ARG NIFI_STAGE_NIFI

FROM ${NIFI_STAGE_MAVEN} AS builder
FROM ${NIFI_STAGE_NIFI} as nifi

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
COPY ./conf/ /opt/nifi/nifi-current/conf_template/
