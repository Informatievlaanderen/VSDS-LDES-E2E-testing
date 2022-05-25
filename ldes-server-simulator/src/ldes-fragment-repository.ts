import { TreeNode } from "./tree-specification";

export interface LdesFragmentsDatabase {
    [key: string]: TreeNode
}

export class LdesFragmentRepository {
    private _fragments: LdesFragmentsDatabase = {};

    public save(path: string, body: TreeNode) {
        this._fragments[path] = body;
    }

    public get(id: string) {
        return this._fragments[id];
    }

    public get fragments(): string[] {
        return Object.keys(this._fragments);
    }
}
