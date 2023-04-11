Feature: Make the Gebouwenregister en Adressenregister (GRAR) data stream available as LDES

  Background:
    Given the members are stored in collection 'ldesmember' in database 'grar'

@grar @test-006
  Scenario: 006: Server Can Substring Fragment an LDES
    Given context 'tests/006.server-substring-fragment-ldes' is started
    And the LDES server is available
    When I start the LDIO workflow
    And the LDIO workflow is available
    And I start the JSON Data Generator
    And the LDES contains at least 13 members
    Then the substring root fragment is not immutable
    And the root fragment contains 'SubstringRelation' relations with values: 'k,1,9,l,g,h,2'
    When the LDES contains at least 73 members
    Then the fragment exists for substring 'ka,ho,gr'
