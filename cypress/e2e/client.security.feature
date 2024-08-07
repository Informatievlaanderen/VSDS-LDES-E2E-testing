@client @security
Feature: LDES Client Security

  @test-032 @oauth @ldio
  Scenario: 032: LDES Client Can Consume OAUTH2 Protected Server Using LDIO Workbench
    Given context 'tests/032.ldes-client-to-oauth-server' is started
    And the protected LDES server is available and configured
    And I start the JSON Data Generator
    And the LDES fragment '/devices/by-page?pageNumber=1' contains at least 3 members
    When I start the LDES Client LDIO workbench
    And I upload the LDIO 'protected-client-pipeline'
    Then the 'devices' sink contains at least 3 members
    And the collection at 'http://localhost:8080/devices' is forbidden
