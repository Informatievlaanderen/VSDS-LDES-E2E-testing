import { LdesFragmentService } from "./ldes-fragment-service";
import { TreeNode } from "./tree-specification";
import { readdir, readFile } from 'node:fs/promises';

export interface Redirection {
    original: string;
    alias: string;
}

export class LdesFragmentController {
    private redirections: any = {};

    constructor(private service: LdesFragmentService) { }

    /**
     * Stores an LDES fragment, replacing the ID of the fragment and its relations with the local origin.
     * @param fragment The fragment, optionally containing relations to other fragments.
     * @returns An object with its path property containing the relative fragment path without the origin.
     */
    public postFragment(fragment: TreeNode): { path: string } {
        return { path: this.service.save(fragment) };
    }

    /**
     * Retrieves a fragment with the given fragmentId. If the fragmentIs is an alias it 'redirects'/follows the given alias recursively.
     * @param fragmentId The ID of the fragment to retrieve.
     * @returns The fragment or undefined.
     */
    public getFragment(fragmentId: string): TreeNode | undefined {
        while (this.redirections[fragmentId] !== undefined) {
            fragmentId = this.redirections[fragmentId];
        }
        return this.service.get(fragmentId);
    }

    /**
     * Retrieves the known aliases and known fragments.
     * @returns An object with the known aliases and known fragments.
     */
    public getStatistics() {
        return { aliases: Object.keys(this.redirections), fragments: this.service.fragments };
    }

    /**
     * Stores an alias for a given fragment ID, allowing to 'redirect' an alias to its original fragment ID (or another alias).
     * @param redirection An object defining a redirection from an alias to its original fragment.
     * @returns An object specifying the recursive 'redirect' that will occur when requesting the alias.
     */
    public postAlias(redirection: Redirection) {
        const original = this.withoutOrigin(redirection.original);
        const alias = this.withoutOrigin(redirection.alias);
        this.redirections[alias] = original;

        let fragmentId = original;
        while (this.redirections[fragmentId] !== undefined) {
            fragmentId = this.redirections[fragmentId];
        }
        return { redirect: { from: alias, to: fragmentId } };
    }

    /**
     * Seeds the simulator with the fragments found in the given directory location. Each file is assumed to contain a fragment and be encoded with UTF-8.
     * @param directoryPath The absolute or relative location of a directory containing fragment files.
     */
    public async seed(directoryPath: string): Promise<{ file: string, fragment: string }[]> {
        const result: { file: string, fragment: string }[] = [];
        const files = await readdir(directoryPath);
        for await (const file of files) {
            const content = await readFile(`${directoryPath}/${file}`, { encoding: 'utf-8' });
            const fragment = this.service.save(JSON.parse(content));
            result.push({ file: file, fragment: fragment });
        }
        return result;
    }

    private withoutOrigin(path: string): string {
        const url = new URL(path);
        return path.replace(`${url.protocol}//${url.host}`, '');
    }
}
