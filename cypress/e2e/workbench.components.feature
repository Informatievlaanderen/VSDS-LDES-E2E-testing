@workbench @materialisation
Feature: LDES Workbench Components

  @test-031 @nifi
  Scenario: 031: all NiFi components work as expected
    Given I have setup context 'tests/031.nifi-workbench-components'
    And environment variable 'HOSTNAME' is defined as the hostname
    When I start the 'test-message-generator' service
    Then the 'observations' sink contains at least 1 members
    And the 'observations' sink contains at least 10 members
    And the 'observations' sink contains at least 100 members
    And the graph database contains 3 observations for the same sensor
    And I tear down the context
