import { IHeaders } from "./http-interfaces";
import { TreeNode } from "./tree-specification";

export interface IFragment {
    content: TreeNode;
    headers: IHeaders;
}

interface LdesFragmentsDatabase {
    [key: string]: IFragment
}

export class LdesFragmentRepository {
    private _fragments: LdesFragmentsDatabase = {};

    public save(id: string, node: TreeNode, headers: IHeaders) {
        this._fragments[id] = {content: node, headers: headers};
    }

    public get(id: string) : IFragment | undefined {
        return this._fragments[id];
    }

    public get keys(): string[] {
        return Object.keys(this._fragments);
    }
}
