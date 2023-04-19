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
    When I upload the data file 'device-model' to the NiFi workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the NiFi workflow
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
    When I upload the data file 'device-model' to the NiFi workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the NiFi workflow
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
    When I upload the data file 'device-model' to the NiFi workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the NiFi workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct OSLO observation version

@iow @test-017
  Scenario: 017: LDIO Workbench Can Convert NGSI-v2 to OSLO
    Given context 'tests/017.ldio-workbench-ngsi-v2-to-oslo' is started
    And the IoW LDES servers are available
    When I upload the data file 'model' to the LDIO workflow with port 9013 and endpoint 'data'
    And the 'device-models' LDES contains 1 member
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the LDIO workflow with port 9012 and endpoint 'data'
    And the 'devices' LDES contains 1 member
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct OSLO observation version

@iow @test-030
  Scenario: 030: LDIO Supports multi ldes
    Given context 'tests/030.ldio-workbench-ngsi-v2-to-oslo' is started
    And the IoW multi LDES server is available
    When I upload the data file 'model' to the LDIO workflow with port 9012 and endpoint 'device-models'
    And the multi LDES server contains 1 members
    And the root fragment of 'device-models' is obtained from the multi LDES server
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the LDIO workflow with port 9012 and endpoint 'devices'
    And the multi LDES server contains 2 members
    And the root fragment of 'devices' is obtained from the multi LDES server
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the multi LDES server contains at least 3 members
    And the root fragment of 'water-quality-observations' is obtained from the multi LDES server
    Then the root fragment contains a correct OSLO observation version
