@workbench @materialisation
Feature: LDES Workbench Repository Materialisation

  @test-024
  Scenario: 024: Can materialise ldes into RDF4J repository using LDIO Workbench
    Given context 'tests/024.workbench-materialize-to-rdf4j' is started
    And I start the LDIO workbench
    And I create the rdf4j repository
    When I upload 5 files from the 'add' directory to pipeline 'rdf4j-pipeline'
    And I wait for the rdf4j repository to contain 21 triples
    When I upload 1 files from the 'update' directory to pipeline 'rdf4j-pipeline'
    Then the rdf4j repository still contains 21 triples
    And the rdf4j repository contains the updated triple

  @test-041
  Scenario: 041: Can materialise ldes into Virtuoso using LDIO Workbench
    Given context 'tests/041.workbench-http-sparql-out' is started
    And I start the LDIO workbench
    When I upload 5 files from the 'add' directory to pipeline 'http-sparql-out-pipeline'
    Then I wait for the virtuoso triple store to contain 21 triples
    And the virtuoso triple store contains a triple set with given name 'Taylor'
    When I upload 1 files from the 'update' directory to pipeline 'http-sparql-out-pipeline'
    Then the virtuoso triple store still contains 21 triples
    And the virtuoso triple store contains a triple set with given name 'CHANGED'
