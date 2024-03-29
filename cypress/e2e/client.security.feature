@client @security
Feature: LDES Client Security

  @test-032 @oauth
  Scenario Outline: 032: LDES Client Can Consume OAUTH2 Protected Server Using '<workbench>' Workbench
    Given the members are stored in database 'iow'
    And context 'tests/032.ldes-client-to-oauth-server' is started
    And the LDES server is available and configured
    And I start the JSON Data Generator
    And the LDES fragment '/devices/by-page?pageNumber=1' contains at least 3 members
    When I start the LDES Client '<workbench>' workbench
    Then the 'devices' sink contains at least 3 members
    And the collection at 'http://localhost:8080/devices' is forbidden

    @ldio
    Examples: 
      | workbench |
      | LDIO      |

    @nifi
    Examples: 
      | workbench |
      | NIFI      |
