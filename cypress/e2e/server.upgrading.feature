@server @upgrading
Feature: LDES Server Upgrading

  @test-021 @iow @BROKEN
  Scenario: 021: Upgrade LDES Server Using LDIO workbench
    Given context 'tests/021.server-upgrade' is started
    And the old LDES server is available
    And I start the LDIO workbench
    And I start the JSON Data Generator
    And the LDES contains at least 26 members in the old database
    And the old ldesfragment collection is structured as expected
    And the old ldesmember collection is structured as expected
    When I pause the 'ngsi-device' pipeline on the LDIO workbench
    And the old server is done processing
    And I remember the last fragment member count for view 'devices-by-time'
    And I bring the old server down
    And I start the new LDES Server
    Then the fragmentation_fragment collection is upgraded as expected
    And the fragmentation_allocation collection is upgraded as expected
    And the ingest_ldesmember collection is upgraded as expected
    And the retention_member_properties collection is upgraded as expected
    And the id of ldesmember has the collectionName 'devices' as prefix
    And the eventstreams collection is upgraded as expected
    And the view collection is upgraded as expected
    And the shacl_shape collection is upgraded as expected
    And the migrated config matches the expected config 'test-021/expected_config.ttl'
    When I resume the 'ngsi-device' pipeline on the LDIO workbench
    Then the LDES member count increases
    And the fragment member count increases for view 'devices-by-time'
