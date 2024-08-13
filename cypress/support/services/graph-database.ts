/// <reference types="cypress" />

export class GraphDatabase {

  constructor(private baseUrl: string) { }

  public queryFile(repository: string, sparqlQueryFile: string) {
    const cmd = `curl -s ${this.baseUrl}/repositories/${repository} -H 'accept: application/x-sparqlstar-results+json' --data-urlencode query@${sparqlQueryFile}`
    return cy.log(cmd).exec(cmd)
      .then(x => JSON.parse(x.stdout))
      .then(x => x.results.bindings);
  }

  public query(repository: string, query: string) {
    const request = { 
      method: 'POST',
      url: `${this.baseUrl}/repositories/${repository}`, 
      headers: { "content-type": 'application/sparql-query', accept: 'application/sparql-results+json' },
      body: query
    };
    return cy.request(request).then(x => x.body.results.bindings);
  }

  public repositoryCount(repository: string) {
    return cy.request({ url: `${this.baseUrl}/repositories/${repository}/size`, headers: { accept: 'application/sparql-results+json' } })
      .then(response => response.body)
      .then(body => Number.parseInt(body));
  }
}