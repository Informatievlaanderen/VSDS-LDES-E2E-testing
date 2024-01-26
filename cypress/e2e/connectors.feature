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
    When The consumer connector is registered with the authority
    And The federated catalog is registered with the authority
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

  @test-034 @federated-catalog
  Scenario: 034: The federated catalog polls and exposes the catalog from the provider
    Given context 'tests/034.dataspace-connector-consumer-and-provider' is started
    Then I wait for the connectors to have started
    When The provider connector is configured
    And The federated catalog is registered with the authority
    Then The federated catalog will eventually contain a policy
