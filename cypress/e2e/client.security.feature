Feature: LDES Client Security

@test-032 @client @security @oauth
Scenario: 032: LDES Client can consume OAUTH2 protected server
  Given context 'tests/032.ldes-client-to-oauth-server' is started
  When the LDES server is available
  And I start the JSON Data Generator
  And I start the LDIO workflow with an OAUTH2 enabled client
  Then the 'devices' sink contains at least 3 members
  And the collection at 'http://localhost:8080/devices' is forbidden