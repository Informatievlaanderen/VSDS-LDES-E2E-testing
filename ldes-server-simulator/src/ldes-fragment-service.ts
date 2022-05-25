import { TreeNode } from "./tree-specification";
import { LdesFragmentRepository } from "./ldes-fragment-repository";

export class LdesFragmentService {
    constructor(private baseUrl: URL, private repository: LdesFragmentRepository) { }

    private changeOrigin(url: URL, origin: URL): URL {
        url.protocol = origin.protocol;
        url.host = origin.host;
        return url;
    }

    public save(body: TreeNode): string {
        const fragmentUrl: URL = this.changeOrigin(new URL(body['@id']), this.baseUrl);
        body['@id'] = fragmentUrl.href;
        body['tree:relation'].forEach(x => x['tree:node'] = this.changeOrigin(new URL(x['tree:node']), this.baseUrl).href);

        const path = fragmentUrl.href.replace(this.baseUrl.href, '/');
        this.repository.save(path, body);
        return path;
    }

    public get(fragmentId: string): TreeNode | undefined {
        return this.repository.get(fragmentId);
    }

    public get fragments(): string[] {
        return this.repository.fragments;
    }
}
