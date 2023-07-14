const treePrefix = 'https://w3id.org/tree#';
export const tree = {
    view: treePrefix + 'view',
    node: treePrefix + 'node',
    Node: treePrefix + 'Node',
    relation: treePrefix + 'relation',
    value: treePrefix + 'value',
    path: treePrefix + 'path',
    member: treePrefix + 'member',
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

const termsPrefix = 'http://purl.org/dc/terms/'
export const terms = {
    isVersionOf: termsPrefix + 'isVersionOf',
    isPartOf: termsPrefix + 'isPartOf',
    prefix: (term: string) => termsPrefix + term,
}

const provPrefix = 'http://www.w3.org/ns/prov#'
export const prov = {
    generatedAtTime: provPrefix + 'generatedAtTime',
    prefix: (term: string) => provPrefix + term,
}

const sosaPrefix = 'http://www.w3.org/ns/sosa/'
export const sosa = {
    phenomenonTime: sosaPrefix + 'phenomenonTime',
    prefix: (term: string) => sosaPrefix + term,
}

export const mimeTypes = {
    turtle: 'text/turtle',
    jsonld: 'application/ld+json',
}

const lcPrefix = 'http://semweb.mmlab.be/ns/linkedconnections#'
export const lc = {
    arrivalStop: lcPrefix + 'arrivalStop',
    departureStop: lcPrefix + 'departureStop',
    prefix: (term: string) => lcPrefix + term,
}
