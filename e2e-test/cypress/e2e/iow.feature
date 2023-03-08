Feature: IoW use case
Implements tests found at https://github.com/Informatievlaanderen/VSDS-LDES-E2E-testing/tree/main/e2e-test/use-cases/iow

  Scenario: Ingest NGSI-v2 objects into LDES server
    Given the 'use-cases/iow/3.ngsi-v2-to-ldes' test is setup
    And context 'use-cases/iow/3.ngsi-v2-to-ldes' is started
    And the IoW LDES servers are available
    And the LDES workbench is available
    And I have uploaded the workflow
    And I started the workflow
    When I upload the data file 'device-model' to the workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct NGSI-LD observation version

  Scenario: Convert Water Quality NGSI to OSLO Model 
    Given the 'use-cases/iow/4.oslo-model-using-jolt' test is setup
    And context 'use-cases/iow/4.oslo-model-using-jolt' is started
    And the IoW LDES servers are available
    And the LDES workbench is available
    And I have uploaded the workflow
    And I started the workflow
    When I upload the data file 'device-model' to the workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a dummy OSLO device model version
    When I upload the data file 'device' to the workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct OSLO device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct OSLO observation version

  Scenario: Use New Framework to Convert Water Quality NGSI-v2 to NGSI-LD or OSLO Model
    Given the 'use-cases/iow/5.use-ldio' test is setup
    And context 'use-cases/iow/5.use-ldio' is started
    And the IoW LDES servers are available
    And the LDES workbench is available
    And I have uploaded the workflow
    And I started the workflow
    When I upload the data file 'device-model' to the workflow
    And the 'device-models' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device model version
    When I upload the data file 'device' to the workflow
    And the 'devices' LDES contains 1 member
    Then the root fragment contains a correct NGSI-LD device version
    When I start the JSON Data Generator
    And the observations LDES contains at least 1 members
    Then the root fragment contains a correct OSLO observation version
