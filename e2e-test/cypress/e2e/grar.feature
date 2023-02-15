Feature: Make the Gebouwenregister en Adressenregister (GRAR) data stream available as LDES

  Scenario: Provide addresses as substring fragmentation
    Given the 'use-cases/grar/1.addresses-substring-fragmentation' test is setup
    And context 'use-cases/grar/1.addresses-substring-fragmentation' is started
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    And I start the JSON Data Generator
    # Then the root fragment is not immutable
    # And the root fragment contains 'SubstringRelation' relations with values: 's,g,f,a,v'
