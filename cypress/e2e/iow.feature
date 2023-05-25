Feature: TODO: name this correctly

# TODO: drop tests 014
@test-014 @workbench @iow
  Scenario: 014: NiFi Workbench Can Convert NGSI-v2 to NGSI-LD
    Given context 'tests/014.nifi-workbench-ngsi-v2-to-ngsi-ld' is started
    And the IoW LDES servers are available
    And the NiFi workbench is available
    And I have uploaded the workflow
    And I started the workflow
    And the 'device-model' ingest endpoint is ready
    And the 'device' ingest endpoint is ready
    When I upload the data file 'device-model' to the NiFi workflow
    And the 'device-models' LDES contains 1 member
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the NiFi workflow
    And the 'devices' LDES contains 1 member
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct NGSI-LD observation version

# TODO: merge tests 015, 016 and 017
@test-015 @workbench @iow
  Scenario: 015: NiFi Workbench Can Convert NGSI-v2 to OSLO
    Given context 'tests/015.nifi-workbench-ngsi-v2-to-oslo' is started
    And the IoW LDES servers are available
    And the NiFi workbench is available
    And I have uploaded the workflow
    And I started the workflow
    And the 'device-model' ingest endpoint is ready
    And the 'device' ingest endpoint is ready
    When I upload the data file 'device-model' to the NiFi workflow
    And the 'device-models' LDES contains 1 member
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the NiFi workflow
    And the 'devices' LDES contains 1 member
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct OSLO observation version

# TODO: merge tests 015, 016 and 017
@test-016 @workbench @iow
  Scenario: 016: Mixed NiFi & LDIO Workbench Can Convert NGSI-v2 to OSLO
    Given context 'tests/016.mixed-workbench-ngsi-v2-to-oslo' is started
    And the IoW LDES servers are available
    And the NiFi workbench is available
    And I have uploaded the workflow
    And I started the workflow
    And the 'device-model' ingest endpoint is ready
    And the 'device' ingest endpoint is ready
    When I upload the data file 'device-model' to the NiFi workflow
    And the 'device-models' LDES contains 1 member
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the NiFi workflow
    And the 'devices' LDES contains 1 member
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct OSLO observation version

# TODO: merge tests 015, 016 and 017
@test-017 @workbench @iow
  Scenario: 017: LDIO Workbench Can Convert NGSI-v2 to OSLO
    Given context 'tests/017.ldio-workbench-ngsi-v2-to-oslo' is started
    And the IoW LDES servers are available
    When I upload the data file 'model' to the LDIO workflow
    And the 'device-models' LDES contains 1 member
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the LDIO workflow
    And the 'devices' LDES contains 1 member
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct OSLO observation version

@test-030 @server @multi-collection @iow
  Scenario: 030: LDIO Supports multi ldes
    Given context 'tests/030.server-allow-multi-collection' is started
    And the IoW multi LDES server is available
    When I upload the data file 'model' to the LDIO workflow with endpoint 'device-models'
    And the multi LDES server contains 1 members
    And the root fragment of 'device-models' is obtained from the multi LDES server
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the LDIO workflow with endpoint 'devices'
    And the multi LDES server contains 2 members
    And the root fragment of 'devices' is obtained from the multi LDES server
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the multi LDES server contains at least 3 members
    And the root fragment of 'water-quality-observations' is obtained from the multi LDES server
    Then the root fragment contains a correct OSLO observation version
