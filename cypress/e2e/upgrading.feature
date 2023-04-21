Feature: server upgrade use case

  @upgrading @test-022
  Scenario: 022: Upgrade LDES Server with LDIO
    Given the members are stored in collection 'ldesmember' in database 'iow_devices'
    Given context 'demos/022.server-upgrade-with-ldio' is started
    And the old LDES server is available
    And I start the JSON Data Generator
    And the LDES contains at least 1 members
    When I pause the LDIO workflow output
    And the old server is done processing
    And I remember the last fragment member count
    And I bring the old server down
    And I start the new LDES Server
    And the LDES server is available
    And I resume the LDIO workflow output
    Then the LDES member count increases
    And the last fragment member count increases

  @upgrading @test-026 @focus
  Scenario: 026: Upgrade LDES workbench with LDI
    Given the members are stored in collection 'ldesmember' in database 'iow_devices'
    Given context 'demos/026.ldio-workbench-upgrade' is started
    And the LDES server is available
    When I set the TARGETURL to the old LDIO
    And I start the JSON Data Generator
    And the LDES contains at least 1 members
    And I start the new LDIO workflow
    When I pause the new LDIO workflow output
    And I set the TARGETURL to the new LDIO
    And the old server is done processing
    And I remember the last fragment member count
    And I bring the old LDIO workbench down
    And I resume the new LDIO workflow output
    Then the LDES member count increases
    And the last fragment member count increases
