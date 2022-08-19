ARG AGTURLEY_NIFI_TAG=1.16.3-jdk17
FROM agturley/nifi:$AGTURLEY_NIFI_TAG
WORKDIR ${NIFI_HOME}
ARG VERSION_BASE=1.0
# Dependency information
ARG GROUP_ID=be.vlaanderen.informatievlaanderen
ARG ARTIFACT_ID=ldes-client-wrappers-nifi
ARG VERSION=${VERSION_BASE}-SNAPSHOT
# NAR
ARG LDES_CLIENT_NAR_TAG
ARG LDES_CLIENT_NAR=${ARTIFACT_ID}-${VERSION_BASE}-${LDES_CLIENT_NAR_TAG}.nar
# Retrieve NAR
ARG PAT_READ_PACKAGES
RUN curl -H "Authorization: Bearer $PAT_READ_PACKAGES" -L -o ./lib/${LDES_CLIENT_NAR} \
    "https://maven.pkg.github.com/Informatievlaanderen/VSDS-LDESClient-NifiProcessor/${GROUP_ID}/${ARTIFACT_ID}/${VERSION}/${LDES_CLIENT_NAR}"
# Run as nifi user
USER nifi
