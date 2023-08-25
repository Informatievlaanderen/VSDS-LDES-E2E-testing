@workbench @repositorymaterialisation
Feature: LDES Workbench Repository Materialisation

  @test-034
  Scenario Outline: 034: Can materialise ldes into RDF4J repository using '<workbench>' Workbench
    Given context 'tests/034.workbench-ldio-repository-materialiser' is started
    And I start the '<workbench>' workbench
    And I create the repository
    When I upload 5 files from the 'add' directory to the workbench
    And I wait for the repository to contain 21 triples
    When I upload 1 files from the 'update' directory to the workbench
    Then the repository still contains 21 triples
    And the repository contains the updated triple

#    @nifi
#    Examples:
#      | workbench |
#      | NIFI      |

    @ldio
    Examples:
      | workbench |
      | LDIO      |
