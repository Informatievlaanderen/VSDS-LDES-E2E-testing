@client @security @connectors
Feature: VSDS Dataspace Connectors

  @test-034 @basic-connector-flow
  Scenario Outline: 034: LDES Client Can Consume Connector Protected Server Using '<workbench>' Workbench
    Given the members are stored in database 'iow'
    And context 'tests/034.dataspace-connector-consumer-and-provider' is started
    And the LDES server is available and configured
    And I start the JSON Data Generator
    And the LDES fragment '/devices/paged?pageNumber=1' contains at least 3 members
    When I start the LDES Client '<workbench>' workbench
    Then The LDES Client is waiting for the token
    And The provider connector is configured
    And The consumer connector is configured
    When I get the policyId from the consumer catalog
    And I start negotiating a contract
    Then I wait for the contract negotiation to finish
    And I start a transfer
    Then The LDES Client is processing the LDES

    @ldio
    Examples:
      | workbench |
      | LDIO      |


  @test-037 @connector-http-code @connector-http-headers
  Scenario Outline: 037: The connector can pass http status codes and headers
    Given the members are stored in database 'iow'
    And context 'tests/037.dataspace-connector-http-code-and-headers' is started
    And the LDES server is available
    When I start the LDES Client '<workbench>' workbench
    When The provider connector is configured
    And The consumer connector is configured
    When I get the policyId from the consumer catalog
    And I start negotiating a contract
    Then I wait for the contract negotiation to finish
    When I start a transfer
    Then The status code is 404


    @ldio
    Examples:
      | workbench |
      | LDIO      |