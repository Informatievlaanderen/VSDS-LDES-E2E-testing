import { IFragmentInfo } from "fragment-interfaces";
import { TreeNode } from "./tree-specification";

export interface IFragment extends IFragmentInfo {
    content: TreeNode;
}

interface LdesFragmentsDatabase {
    [key: string]: IFragment
}

export class LdesFragmentRepository {
    private _fragments: LdesFragmentsDatabase = {};

    public save(id: string, node: TreeNode, validity: number | undefined) {
        this._fragments[id] = {id: id, content: node, maxAge: validity};
    }

    public get(id: string) : IFragment | undefined {
        return this._fragments[id];
    }

    public get fragments(): string[] {
        return Object.keys(this._fragments);
    }
}
