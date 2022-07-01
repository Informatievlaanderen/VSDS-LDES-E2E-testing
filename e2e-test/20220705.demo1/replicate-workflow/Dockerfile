FROM agturley/nifi:1.16.3-jdk17
WORKDIR ${NIFI_HOME}
ARG PAT_READ_PACKAGES
RUN curl -H "Authorization: Bearer $PAT_READ_PACKAGES" -L -o ./lib/ldes-processors-1.0-20220630.141536-10.nar \
    'https://maven.pkg.github.com/Informatievlaanderen/VSDS-LDESClient-NifiProcessor/be.vlaanderen.informatievlaanderen/ldes-processors/1.0-SNAPSHOT/ldes-processors-1.0-20220630.141536-10.nar'
