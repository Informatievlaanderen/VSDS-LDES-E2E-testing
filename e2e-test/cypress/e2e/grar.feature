Feature: Make the Gebouwenregister en Adressenregister (GRAR) data stream available as LDES

Implements tests found at https://github.com/Informatievlaanderen/VSDS-LDES-E2E-testing/tree/main/e2e-test/use-cases/grar

  Background:
    Given the members are stored in collection 'ldesmember' in database 'grar'

  Scenario: Provide addresses as substring fragmentation
    Given the 'use-cases/grar/1.addresses-substring-fragmentation' test is setup
    And context 'use-cases/grar/1.addresses-substring-fragmentation' is started
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    And the LDES server is available
    When I start the workflow
    And I start the JSON Data Generator
    And the LDES contains at least 13 members
    Then the root fragment is not immutable
    And the root fragment contains 'SubstringRelation' relations with values: 'k,1,9,l,g,h,2'
    When the LDES contains at least 73 members
    Then the fragment exists for substring 'ka,ho,gr'
