@workbench @materialisation
Feature: LDES Workbench Components

  @test-031 @nifi
  Scenario: 031: all NiFi components work as expected
    Given we use context 'tests/031.nifi-workbench-components'
    Given we are testing version '2.9.0-SNAPSHOT' of the LDI NiFI components found in 'ldi-processors-bundle-2.9.0-20240724.102650-2-nar-bundle.jar'
    And environment variable 'LOCALHOST' is defined as the hostname
    And the previously defined context is started
    And the graph database is available and configured
    And the LDES server is available and configured
    And I start the NIFI workflow
    When I start the JSON Data Generator
    Then the 'observations' sink contains at least 1 members
    And the 'observations' sink contains at least 10 members
    And the 'observations' sink contains at least 100 members
    And the graph database contains 3 observations for the same sensor
    And the previously defined context is stopped
    And we remove the LDI NiFi components