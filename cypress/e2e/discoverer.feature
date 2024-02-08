@discoverer
Feature: LDI LDES Discoverer

  @test-038 @discover @parkAndRide
  Scenario: 038: LDES Discoverer Can Discover The Structure of an LDES
    Given the members are stored in database 'Gent'
    And context 'tests/038.discover-ldes-structure' is started
    And I have aliased the 'parkAndRide' simulator data set
    When I start the LDES Discoverer
    Then the LDES structure contains 4 relations
