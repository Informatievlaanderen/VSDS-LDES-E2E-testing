import { TreeNode } from "./tree-specification";
import { IFragment, LdesFragmentRepository } from "./ldes-fragment-repository";
import { IFragmentInfo } from "fragment-interfaces";
import { IHeaders } from "http-interfaces";

export interface ICreateFragmentOptions { 
    'max-age': number;
}

export class LdesFragmentService {
    constructor(public baseUrl: URL, private repository: LdesFragmentRepository) { }

    public save(node: TreeNode, options?: ICreateFragmentOptions | undefined, headers?: IHeaders | undefined): IFragmentInfo {
        const fragmentUrl: URL = this.changeOrigins(node);
        const id = fragmentUrl.href.replace(this.baseUrl.href, '/');
        headers = this.addCacheControlHeader(options, headers);
        this.repository.save(id, node, headers);
        return {...headers, id: id};
    }


    private addCacheControlHeader(options: ICreateFragmentOptions | undefined, headers: IHeaders | undefined) {
        const maxAge = options?.['max-age'];
        headers = { ...headers, 'cache-control': maxAge ? `public, max-age=${maxAge}` : 'public, max-age=604800, immutable' };
        return headers;
    }

    private changeOrigin(url: URL, origin: URL): URL {
        url.protocol = origin.protocol;
        url.host = origin.host;
        return url;
    }

    private changeOrigins(node: TreeNode) {
        const fragmentUrl: URL = this.changeOrigin(new URL(node['@id']), this.baseUrl);
        node['@id'] = fragmentUrl.href;
        node['tree:relation'].forEach(x => x['tree:node'] = this.changeOrigin(new URL(x['tree:node']), this.baseUrl).href);
        return fragmentUrl;
    }

    public get(fragmentId: string): IFragment | undefined {
        return this.repository.get(fragmentId);
    }

    public get fragmentIds(): string[] {
        return this.repository.keys;
    }
}
