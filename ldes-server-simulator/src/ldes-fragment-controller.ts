import { ICreateFragmentOptions, LdesFragmentService } from "./ldes-fragment-service";
import { TreeNode } from "./tree-specification";
import { readdir, readFile } from 'node:fs/promises';
import { IGetRequest, IPostRequest, IResponse, mimeJsonLd } from "./http-interfaces";
import { IAlias, IFragmentId, IFragmentInfo, IRedirection, IStatistics, IStatisticsResponses } from "./fragment-interfaces";

export class LdesFragmentController {
    private _redirections: {[key: string]: string} = {};
    private _requests: {[key: string]: Date[]} = {};

    private addStatistics(fragmentId: string) {
        let responses = this._requests[fragmentId];
        if (!responses) {
            responses = this._requests[fragmentId] = [];
        }
        responses.push(new Date());
    }

    constructor(private service: LdesFragmentService) { }

    /**
     * Stores an LDES fragment, replacing the ID of the fragment and its relations with the local origin.
     * @param request The request with its body containing the fragment which optionally contains relations to other fragments.
     * @returns An IFragmentInfo object with its ID property containing the relative fragment path without the origin.
     */
    public postFragment(request: IPostRequest<TreeNode, ICreateFragmentOptions>): IResponse<IFragmentInfo> {
        return {
            status: 201, 
            body: this.service.save(request.body, request.query, request.headers),
        };
    }

    /**
     * Retrieves a fragment with the given fragmentId. If the fragmentIs is an alias it 'redirects'/follows the given alias recursively.
     * @param request A get request with the query containing the ID of the fragment to retrieve.
     * @returns The fragment or undefined.
     */
    public getFragment(request: IGetRequest<IFragmentId>): IResponse<TreeNode | undefined> {
        let fragmentId = request.query.id;
        while (this._redirections[fragmentId] !== undefined) {
            fragmentId = this._redirections[fragmentId] ?? '';
        }
        const fragment = fragmentId ? this.service.get(fragmentId) : undefined;
        this.addStatistics(fragmentId);
        return {
            status: fragment === undefined ? 404 : 200,
            body: fragment?.content,
            headers: fragment?.headers,
        }
    }

    /**
     * Retrieves the known aliases and known fragments.
     * @returns An object with the known aliases and known fragments.
     */
    public getStatistics(): IResponse<IStatistics> {
        const responses: {[key: string]: IStatisticsResponses} = {};
        Object.keys(this._requests).forEach(x => 
            responses[x] = ({ count: this._requests[x]?.length, at: this._requests[x]} as IStatisticsResponses));

        return {
            status: 200, 
            body: { 
                aliases: Object.keys(this._redirections), 
                fragments: this.service.fragmentIds,
                responses: responses,
            }
        };
    }

    /**
     * Stores an alias for a given fragment ID, allowing to 'redirect' an alias to its original fragment ID (or another alias).
     * @param request A request defining an alias to an original fragment.
     * @returns An object specifying the recursive 'redirect' that will occur when requesting the alias.
     */
    public postAlias(request: IPostRequest<IAlias>): IResponse<IRedirection> {
        const redirection = request.body;
        const original = this.withoutOrigin(redirection.original);
        const alias = this.withoutOrigin(redirection.alias);
        this._redirections[alias] = original;

        let fragmentId: string = original;
        while (this._redirections[fragmentId]) {
            fragmentId = this._redirections[fragmentId] ?? '';
        }
        return {
            status: 201,
            body: { 
                from: alias, 
                to: fragmentId 
            } 
        };
    }

    /**
     * Seeds the simulator with the fragments found in the given directory location. Each file is assumed to contain a fragment and be encoded with UTF-8.
     * @param directoryPath The absolute or relative location of a directory containing fragment files.
     */
    public async seed(directoryPath: string): Promise<{ file: string, fragment: IFragmentInfo }[]> {
        const result: { file: string, fragment: IFragmentInfo }[] = [];
        const files = await readdir(directoryPath);
        for await (const file of files) {
            const content = await readFile(`${directoryPath}/${file}`, { encoding: 'utf-8' });
            const fragment = this.service.save(JSON.parse(content), undefined, {'content-type': mimeJsonLd});
            result.push({ file: file, fragment: fragment });
        }
        return result;
    }

    private withoutOrigin(path: string): string {
        const url = new URL(path);
        return path.replace(`${url.protocol}//${url.host}`, '');
    }
}
