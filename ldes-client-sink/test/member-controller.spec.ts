import { Literal, NamedNode, Quad } from 'n3';
import { MemberController } from '../src/member-controller';

describe('Member controller tests', () => {

    let sut: MemberController;

    const example = 'http://example.org/';
    const schema = 'http://schema.org/';
    const tree = 'https://w3id.org/tree#';
    const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

    const ldesId = example + 'id/ldes/us-presidents';

    const obamaId = example + 'id/barack-obama';
    const obama = [
        new Quad(new NamedNode(obamaId), new NamedNode(rdf + 'type'), new NamedNode(schema + 'Person')),
        new Quad(new NamedNode(obamaId), new NamedNode(schema + 'name'), new Literal('Barack Hussein Obama')),
    ];

    const trumpId = example + 'id/donald-trump';
    const trump = [
        new Quad(new NamedNode(trumpId), new NamedNode(rdf + 'type'), new NamedNode(schema + 'Person')),
        new Quad(new NamedNode(trumpId), new NamedNode(schema + 'name'), new Literal('Donald John Trump')),
    ];

    function member(person: Quad[]) {
        if (person && person[0]) {
            const id = person[0].subject.value;
            return [
                ...person,
                new Quad(new NamedNode(ldesId), new NamedNode(tree + 'member'), new NamedNode(id)),
            ];
        } else {
            throw new Error('Invalid person');
        }
    }

    function not_a_member(person: Quad[]) {
        return [...person];
    }

    beforeEach(() => {
        sut = new MemberController();
    });

    describe('get count tests', () => {
        it('should return 0 initially', () => {
            expect(sut.count).toBe(0);
        });
        it('should return the member count', () => {
            sut.add(member(obama));
            expect(sut.count).toBe(1);
        });
    });

    describe('add member tests', () => {
        it('should auto-detect ID', () => {
            const id = sut.add(member(obama));
            expect(id).toBe(obamaId);
        });
        it('should fail if no ID found', () => {
            const id = sut.add(not_a_member(trump));
            expect(id).toBeUndefined();
        });
        it('should fail if adding multiple members at once', () => {
            const id = sut.add([...member(obama), ...member(trump)]);
            expect(id).toBeUndefined();
        });
    });

    describe('get member IDs tests', () => {
        it('should return empty set initially', () => {
            expect(sut.ids).toEqual([]);
        });
        it('should return the member IDs', () => {
            sut.add(member(obama));
            sut.add(member(trump));
            expect(sut.ids).toEqual([obamaId, trumpId]);
        });
    });

    describe('get member tests', () => {
        it('should fail if ID not found', () => {
            sut.add(member(obama));
            expect(sut.get(trumpId)).toBeUndefined();
        });
        it('should return the member quads', () => {
            sut.add(member(obama));
            expect(sut.get(obamaId)).toStrictEqual<Quad[]>(member(obama));
        });
    });

});