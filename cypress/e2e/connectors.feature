@client @security @connectors
Feature: VSDS Dataspace Connectors

  @test-034
  Scenario Outline: 034: LDES Client Can Consume Connector Protected Server Using '<workbench>' Workbench
    Given the members are stored in database 'iow'
    And context 'tests/034.dataspace-connector-consumer-and-provider' is started
    And the LDES server is available and configured
    And I start the JSON Data Generator
    And the LDES fragment '/devices/paged?pageNumber=1' contains at least 3 members
    When I start the LDES Client '<workbench>' workbench
    Then The LDES Client is waiting for the token
    When The provider connector is configured
    And The consumer connector is configured
    Then I initiate a transfer
    Then The LDES Client is processing the LDES

    @ldio
    Examples:
      | workbench |
      | LDIO      |