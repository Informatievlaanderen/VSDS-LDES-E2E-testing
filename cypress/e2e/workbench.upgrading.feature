@workbench @upgrading
Feature: LDES Workbench Upgrading

  @iow
  Scenario: 026: Upgrade LDES LDIO Workbench
    Given context 'tests/026.ldio-workbench-upgrade' is started
    And the LDES server is available and configured
    And the old LDIO workbench is available
    When I set the TARGETURL to the old LDIO workbench
    And I start the JSON Data Generator
    And the LDES contains at least 1 members
    When I start the new LDIO workbench
    And I pause the 'upgrade-pipeline' pipeline on the new LDIO workbench
    And I set the TARGETURL to the new LDIO workbench
    Then the member count does not change
    When I bring the old LDIO workbench down
    And I remember the last fragment member count for view 'by-page'
    And I resume the 'upgrade-pipeline' pipeline on the new LDIO workbench
    Then the LDES member count increases
    And the fragment member count increases for view 'by-page'
