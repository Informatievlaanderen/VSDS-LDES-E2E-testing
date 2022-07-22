# syntax=docker/dockerfile:1

#
# INSTALL nifi
#

FROM maven:3.8.5-openjdk-18 AS builder
FROM agturley/nifi:1.16.3-jdk17 as nifi

# MAVEN: application
FROM builder as clone-stage
RUN git clone https://github.com/Informatievlaanderen/VSDS-LDESClient-NifiProcessor.git nifi-repo

# MAVEN: install
FROM builder as build-stage
WORKDIR /nifi-processors-bundle
COPY --from=clone-stage nifi-repo .
RUN mvn install

# NIFI: setup nar
FROM nifi
WORKDIR /opt/nifi/nifi-current
COPY --from=build-stage /nifi-processors-bundle/ldes-processors/target/*.nar ./lib/

# NIFI: configure
COPY ./conf/ /opt/nifi/nifi-current/conf_template/
