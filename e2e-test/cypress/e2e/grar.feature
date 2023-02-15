Feature: Make the Gebouwenregister en Adressenregister (GRAR) data stream available as LDES

  Scenario: Provide addresses as substring fragmentation
    Given the 'use-cases/grar/1.addresses-substring-fragmentation' test is setup
    And context 'use-cases/grar/1.addresses-substring-fragmentation' is started
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    And I start the service named 'json-data-generator'
    # Then a substring fragmented LDES view is created