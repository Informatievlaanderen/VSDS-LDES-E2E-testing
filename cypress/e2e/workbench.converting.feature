@workbench @converting
Feature: LDES Workbench Conversions

  @test-014 @ngsi @iow @ldio
  Scenario: 014: Can Convert NGSI-v2 to NGSI-LD Using LDIO Workbench
    Given context 'tests/014.workbench-ngsi-v2-to-ngsi-ld' is started
    And the LDES server is available and configured
    And I start the LDIO workbench
    When I upload the data file 'device-model' to the workbench
    And the LDES contains 1 members
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workbench
    And the LDES contains 2 members
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the LDES contains at least 3 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct NGSI-LD observation version

  @test-017 @ngsi @iow @ldio
  Scenario: 017: Can Convert NGSI-v2 to OSLO Using LDIO Workbench
    Given context 'tests/017.ldio-workbench-ngsi-v2-to-oslo' is started
    And the LDES server is available and configured
    And the LDIO workbench is available
    When I upload the data file 'device-model' to the workbench
    And the LDES contains 1 members
    And the root fragment of 'device-models' is obtained
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workbench
    And the LDES contains 2 members
    And the root fragment of 'devices' is obtained
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the LDES contains at least 3 members
    And the root fragment of 'water-quality-observations' is obtained
    Then the root fragment contains a correct OSLO observation version
