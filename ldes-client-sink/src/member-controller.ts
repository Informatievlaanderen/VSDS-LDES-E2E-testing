import { Quad } from "n3";

interface MemberDatabase {
    [key: string]: Quad[];
}

export class MemberController {

    private members: MemberDatabase = {};

    public get count(): number {
        return this.ids.length;
    }

    public get ids(): string[] {
        return Object.keys(this.members);
    }

    public get(id: string): Quad[] | undefined {
        return this.members[id];
    }

    public add(quads: Quad[]): string | undefined {
        const tree = 'https://w3id.org/tree#';
        const tree_member = tree + 'member';
        const ids = quads.filter(x => x.predicate.value === tree_member);

        if (ids && ids.length === 1 && ids[0]) {
            const id = ids[0].object.value;
            this.members[id] = quads;
            return id;
        }

        return undefined;
    }
}