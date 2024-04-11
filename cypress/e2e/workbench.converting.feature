@workbench @converting
Feature: LDES Workbench Conversions

  @test-014 @ngsi @iow
  Scenario Outline: 014: Can Convert NGSI-v2 to NGSI-LD Using '<workbench>' Workbench
    Given the members are stored in database 'iow'
    And context 'tests/014.workbench-ngsi-v2-to-ngsi-ld' is started
    And the LDES server is available and configured
    And I start the '<workbench>' workbench
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

    @nifi
    Examples:
      | workbench |
      | NIFI      |

    @ldio
    Examples:
      | workbench |
      | LDIO      |

  @ngsi @iow
  Scenario Outline: <test-number>: Can Convert NGSI-v2 to OSLO Using '<workbench>' Workbench
    Given the members are stored in database 'iow'
    And context 'tests/<test-number>.<test-name>' is started
    And the LDES server is available and configured
    And the '<workbench>' workbench is available
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

    @test-015 @nifi
    Examples:
      | workbench | test-number | test-name                      |
      | NIFI      |         015 | nifi-workbench-ngsi-v2-to-oslo |

    @test-016 @nifi @ldio
    Examples:
      | workbench   | test-number | test-name                       |
      | NIFI & LDIO |         016 | mixed-workbench-ngsi-v2-to-oslo |

    @test-017 @ldio
    Examples: 
      | workbench | test-number | test-name                      |
      | LDIO      |         017 | ldio-workbench-ngsi-v2-to-oslo |
