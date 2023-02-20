const treePrefix = 'https://w3id.org/tree#';
export const tree = {
    view: treePrefix + 'view',
    node: treePrefix + 'node',
    Node: treePrefix + 'Node',
    relation: treePrefix + 'relation',
    value: treePrefix + 'value',
    path: treePrefix + 'path',
    prefix: (term: string) => treePrefix + term,
}

const rdfPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
export const rdf = {
    type: rdfPrefix + 'type',
    prefix: (term: string) => rdfPrefix + term,
}

const ldesPrefix = 'https://w3id.org/ldes#'
export const ldes = {
    EventStream: ldesPrefix + 'EventStream',
    prefix: (term: string) => ldesPrefix + term,
}

export const mimeTypes = {
    turtle: 'text/turtle',
    jsonld: 'application/ld+json',
}
