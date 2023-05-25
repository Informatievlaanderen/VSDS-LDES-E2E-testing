Feature: LDES Workbench Upgrading

# TODO: merge tests 023 and 026
  @test-023 @workbench @upgrading 
  Scenario: 023: Upgrade LDES workbench
    Given the members are stored in database 'iow_devices'
    Given context 'tests/023.nifi-workbench-upgrade' is started
    And the LDES server is available
    And the old NiFi workbench is available
    And I have uploaded the old workflow
    And I started the old workflow
    And I set the TARGETURL to the old workflow
    And I start the JSON Data Generator
    And the LDES contains at least 1 members
    
    When I start the new NiFi workbench
    And I have uploaded the new workflow
    And I started the workflow
    And I stop the http sender in the workflow
    And I set the TARGETURL to the new workflow
    Then the member count does not change
    
    When I bring the old NiFi workbench down
    And I remember the last fragment member count
    And I start the http sender in the workflow
    Then the LDES member count increases
    And the last fragment member count increases

# TODO: merge tests 023 and 026
  @test-026 @workbench @upgrading 
  Scenario: 026: Upgrade LDES workbench with LDI
    Given the members are stored in database 'iow_devices'
    And context 'tests/026.ldio-workbench-upgrade' is started
    And the LDES server is available
    And I set the TARGETURL to the old LDIO
    And I start the JSON Data Generator
    And the LDES contains at least 1 members
    When I start the new LDIO workflow
    And I pause the new LDIO workflow output
    And I set the TARGETURL to the new LDIO
    And the member count does not change
    And I remember the last fragment member count
    And I bring the old LDIO workbench down
    And I resume the new LDIO workflow output
    Then the LDES member count increases
    And the last fragment member count increases
