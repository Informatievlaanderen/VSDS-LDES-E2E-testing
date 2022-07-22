ARG AGTURLEY_NIFI_TAG=1.16.3-jdk17
FROM agturley/nifi:$AGTURLEY_NIFI_TAG
WORKDIR ${NIFI_HOME}
ARG PAT_READ_PACKAGES
ARG LDES_CLIENT_NAR_TAG
RUN curl -H "Authorization: Bearer $PAT_READ_PACKAGES" -L -o ./lib/ldes-processors-1.0.nar \
    "https://maven.pkg.github.com/Informatievlaanderen/VSDS-LDESClient-NifiProcessor/be.vlaanderen.informatievlaanderen/ldes-processors/1.0-SNAPSHOT/ldes-processors-1.0-$LDES_CLIENT_NAR_TAG.nar"
