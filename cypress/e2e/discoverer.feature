@discoverer
Feature: LDI LDES Discoverer

  @test-038 @discover @parkAndRide
  Scenario: 038: LDES Discoverer Can Discover The Structure of an LDES
    Given context 'tests/038.discover-ldes-structure' is started
    And I have aliased the 'geomobility' simulator data set
    When I start the LDES Discoverer
    Then the LDES structure contains 10 relations
    And the LDES structure is equal to "expected-output.txt"
