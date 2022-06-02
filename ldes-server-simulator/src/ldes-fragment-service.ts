import { TreeNode } from "./tree-specification";
import { IFragment, LdesFragmentRepository } from "./ldes-fragment-repository";
import { IFragmentInfo } from "fragment-interfaces";

export class LdesFragmentService {
    constructor(private baseUrl: URL, private repository: LdesFragmentRepository) { }

    private changeOrigin(url: URL, origin: URL): URL {
        url.protocol = origin.protocol;
        url.host = origin.host;
        return url;
    }

    public save(node: TreeNode, maxAge: number | undefined): IFragmentInfo {
        const fragmentUrl: URL = this.changeOrigin(new URL(node['@id']), this.baseUrl);
        node['@id'] = fragmentUrl.href;
        node['tree:relation'].forEach(x => x['tree:node'] = this.changeOrigin(new URL(x['tree:node']), this.baseUrl).href);

        const id = fragmentUrl.href.replace(this.baseUrl.href, '/');
        this.repository.save(id, node, maxAge);
        return {id: id, maxAge: maxAge};
    }

    public get(fragmentId: string): IFragment | undefined {
        return this.repository.get(fragmentId);
    }

    public get fragments(): string[] {
        return this.repository.fragments;
    }
}
