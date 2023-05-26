@workbench @ngsi
Feature: TODO: move this to workbench.converting.feature after manual test rework

@test-014 @iow
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
