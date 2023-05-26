@workbench @ngsi
Feature: TODO: move this to server.basics.feature after manual test rework

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
