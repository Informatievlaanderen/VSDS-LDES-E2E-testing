/// <reference types="cypress" />

export class GraphDatabase {

  constructor(private baseUrl: string) { }

  public query(repository: string, sparqlQueryFile: string) {
    const cmd = `curl -s ${this.baseUrl}/repositories/${repository} -H 'accept: application/x-sparqlstar-results+json' --data-urlencode query@${sparqlQueryFile}`
    return cy.log(cmd).exec(cmd)
      .then(x => JSON.parse(x.stdout))
      .then(x => x.results.bindings);
  }
}