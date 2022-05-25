export interface TreeRelation {
    'tree:node': string;
}

export interface TreeNode {
    '@id': string;
    'tree:relation': TreeRelation[];
}
