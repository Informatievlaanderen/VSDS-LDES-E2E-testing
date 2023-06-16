@server
Feature: LDES Server Upgrading

  @test-021 @iow
  Scenario Outline: 021: Upgrade LDES Server Using '<workbench>' workbench
    Given the members are stored in database 'iow_devices'
    And context 'tests/021.server-upgrade' is started
    And the old LDES server is available
    And I start the '<workbench>' workbench
    And I start the JSON Data Generator
    And the LDES contains at least 26 members
    And the ldesfragment collection is structured as expected
    And the ldesmember collection is structured as expected
    When I pause the '<workbench>' workbench output
    And the old server is done processing
    And I remember the last fragment member count
    And I bring the old server down
    And I start the new LDES Server
    Then the ldesfragment collection is upgraded as expected
    And the ldesmember collection is upgraded as expected
    When I resume the '<workbench>' workbench output
    Then the LDES member count increases
    And the last fragment member count increases

    @nifi
    Examples: 
      | workbench |
      | NIFI      |

    @ldio
    Examples: 
      | workbench |
      | LDIO      |
