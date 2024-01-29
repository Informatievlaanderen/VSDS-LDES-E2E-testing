@workbench @upgrading
Feature: LDES Workbench Upgrading

  @iow
  Scenario Outline: <test-number>: Upgrade LDES '<workbench>' Workbench
    Given the members are stored in database 'iow_devices'
    And context 'tests/<test-number>.<test-name>' is started
    And the LDES server is available and configured
    And the old '<workbench>' workbench is available
    When I set the TARGETURL to the old '<workbench>' workbench
    And I start the JSON Data Generator
    And the LDES contains at least 1 members
    When I start the new '<workbench>' workbench
    And I pause the 'upgrade-pipeline' pipeline on the new '<workbench>' workbench
    And I set the TARGETURL to the new '<workbench>' workbench
    Then the member count does not change
    When I bring the old '<workbench>' workbench down
    And I remember the last fragment member count for view 'by-page'
    And I resume the 'upgrade-pipeline' pipeline on the new '<workbench>' workbench
    Then the LDES member count increases
    And the fragment member count increases for view 'by-page'

    @test-023 @nifi
    Examples: 
      | workbench | test-number | test-name              |
      | NIFI      |         023 | nifi-workbench-upgrade |

    @test-026 @ldio
    Examples: 
      | workbench | test-number | test-name              |
      | LDIO      |         026 | ldio-workbench-upgrade |
