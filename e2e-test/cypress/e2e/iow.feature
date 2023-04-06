Feature: IoW use case

@iow @test-014
  Scenario: 014: NiFi Workbench Can Convert NGSI-v2 to NGSI-LD
    Given context 'tests/014.nifi-workbench-ngsi-v2-to-ngsi-ld' is started
    And the IoW LDES servers are available
    And the NiFi workbench is available
    And I have uploaded the workflow
    And I started the workflow
    And the 'device-model' ingest endpoint is ready
    And the 'device' ingest endpoint is ready
    When I upload the data file 'device-model' to the workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct NGSI-LD observation version

@iow @test-015
  Scenario: 015: NiFi Workbench Can Convert NGSI-v2 to OSLO
    Given context 'tests/015.nifi-workbench-ngsi-v2-to-oslo' is started
    And the IoW LDES servers are available
    And the NiFi workbench is available
    And I have uploaded the workflow
    And I started the workflow
    And the 'device-model' ingest endpoint is ready
    And the 'device' ingest endpoint is ready
    When I upload the data file 'device-model' to the workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct OSLO observation version

@iow @test-016
  Scenario: 016: Mixed NiFi & LDIO Workbench Can Convert NGSI-v2 to OSLO
    Given context 'tests/016.mixed-workbench-ngsi-v2-to-oslo' is started
    And the IoW LDES servers are available
    And the NiFi workbench is available
    And I have uploaded the workflow
    And I started the workflow
    And the 'device-model' ingest endpoint is ready
    And the 'device' ingest endpoint is ready
    When I upload the data file 'device-model' to the workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct OSLO observation version
