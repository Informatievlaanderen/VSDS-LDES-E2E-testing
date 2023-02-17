Feature: Make the Gebouwenregister en Adressenregister (GRAR) data stream available as LDES

  Scenario: Provide addresses as substring fragmentation
    Given the 'use-cases/grar/1.addresses-substring-fragmentation' test is setup
    And context 'use-cases/grar/1.addresses-substring-fragmentation' is started
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    And I start the JSON Data Generator
    And the LDES contains at least 13 members
    Then the root fragment is not immutable
    And the root fragment contains 'SubstringRelation' relations with values: 'k,h,g'
    # TODO: enable this when tokenizing works
    # And the root fragment contains 'SubstringRelation' relations with values: 'k,1,9,l,g,h,2'
    When the LDES contains at least 43 members
    Then the fragment exists for substring 'ka,ho,gr'
