@workbench @materialisation
Feature: LDES Workbench Components

  @test-031 @nifi
  Scenario Outline: 031: all NiFi components work as expected
    Given environment variable 'LOCALHOST' is defined as the hostname
    And context 'tests/031.nifi-workbench-components' is started
    And the graph database is available and configured
    And the LDES server is available and configured
    And I start the 'NIFI' workbench
    When I start the JSON Data Generator
    Then the 'observations' sink contains at least 1 members
    And the 'observations' sink contains at least 10 members
    And the 'observations' sink contains at least 100 members
    And the graph database contains 3 observations for the same sensor
    