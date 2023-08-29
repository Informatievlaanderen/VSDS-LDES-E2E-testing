@workbench @materialisation
Feature: LDES Workbench Repository Materialisation

  @test-024
  Scenario Outline: 024: Can materialise ldes into RDF4J repository using '<workbench>' Workbench
    Given context 'tests/024.workbench-materialize-to-rdf4j' is started
    And I start the '<workbench>' workbench
    And I create the rdf4j repository
    When I upload 5 files from the 'add' directory to the workbench
    And I wait for the rdf4j repository to contain 21 triples
    When I upload 1 files from the 'update' directory to the workbench
    Then the rdf4j repository still contains 21 triples
    And the rdf4j repository contains the updated triple

    @nifi
    Examples:
      | workbench |
      | NIFI      |

    @ldio
    Examples:
      | workbench |
      | LDIO      |
