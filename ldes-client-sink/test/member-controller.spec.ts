import { DataFactory, Parser, Quad, Writer } from 'n3';
import { MemberController } from '../src/member-controller';
import { Member } from '../src/member';
import { MemoryStorage } from '../src/memory-storage';

describe('Member controller tests', () => {

    let sut: MemberController;
    let storage: MemoryStorage;

    const example = 'http://example.org/';
    const schema = 'http://schema.org/';
    const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const personType = schema + 'Person';
    const personTypeName = 'person';

    const obamaId = example + 'id/barack-obama';
    const obama = [
        DataFactory.quad(DataFactory.namedNode(obamaId), DataFactory.namedNode(rdf + 'type'), DataFactory.namedNode(schema + 'Person')),
        DataFactory.quad(DataFactory.namedNode(obamaId), DataFactory.namedNode(schema + 'name'), DataFactory.literal('Barack Hussein Obama')),
    ];
    const obamaMember = member(obama);

    const trumpId = example + 'id/donald-trump';
    const trump = [
        DataFactory.quad(DataFactory.namedNode(trumpId), DataFactory.namedNode(rdf + 'type'), DataFactory.namedNode(schema + 'Person')),
        DataFactory.quad(DataFactory.namedNode(trumpId), DataFactory.namedNode(schema + 'name'), DataFactory.literal('Donald John Trump')),
    ];
    const trumpMember = member(trump);

    function member(quads: Quad[]): Member {
        if (quads) {
            const contentType = 'application/N-quads';
            const writer = new Writer({format: contentType});
            const body = writer.quadsToString(quads);
            return { contentType: contentType, body: body } as Member;
        } else {
            throw new Error('Invalid person');
        }
    }

    function asQuads(member: Member): Quad[] {
        if (member) {
            const parser = new Parser({format: member.contentType});
            return parser.parse(member.body);
        } else {
            throw new Error('Invalid member');
        }
    }

    beforeEach(() => {
        storage = new MemoryStorage(personTypeName);
        sut = new MemberController(personType, storage);
    });

    describe('setup and teardown', () => {
        it('should call initialize', async () => {
            await sut.init();
            expect(storage.initialized).toBeTruthy();
        });
        it('should call terminate', async () => {
            await sut.dispose();
            expect(storage.terminated).toBeTruthy();
        });
    })

    describe('get count tests', () => {
        it('should return 0 initially', async () => {
            const expected = { person: {total: 0} };
            const actual = await sut.getIndex();
            expect(actual).toStrictEqual(expected);
        });
        it('should return the member count', async () => {
            await sut.postMember(obamaMember, obama);
            const expected = { person: {total: 1} };
            const actual = await sut.getIndex();
            expect(actual).toStrictEqual(expected);
        });
    });

    describe('add member tests', () => {
        it('should auto-detect ID', async () => {
            const id = await sut.postMember(obamaMember, obama);
            expect(id).toBe(obamaId);
        });
        it('should fail if no ID found', async () => {
            const withoutRdfType = trump.filter(x => x.predicate.value !== rdf + 'type');
            const id = await sut.postMember(member(withoutRdfType), withoutRdfType);
            expect(id).toBeUndefined();
        });
        it('should fail if adding multiple members at once', async () => {
            const multipleMembers = [...obama, ...trump]
            const id = await sut.postMember(member(multipleMembers), multipleMembers);
            expect(id).toBeUndefined();
        });
        it('should update if duplicate found', async() => {
            await sut.postMember(obamaMember, obama);
            const updatedName = 'Barack Hussein Obama II';
            const updatedObama = [
                DataFactory.quad(DataFactory.namedNode(obamaId), DataFactory.namedNode(rdf + 'type'), DataFactory.namedNode(schema + 'Person')),
                DataFactory.quad(DataFactory.namedNode(obamaId), DataFactory.namedNode(schema + 'name'), DataFactory.literal(updatedName)),
            ];
            await sut.postMember(member(updatedObama), updatedObama);
            const currentMember = await sut.getMember(obamaId);
            const quads = currentMember ? asQuads(currentMember) : undefined;
            const nameProperty = quads?.filter(x => x.predicate.value === schema + 'name');
            const currentName = nameProperty?.shift()?.object.value;
            expect(currentName).toBe(updatedName);
        });
    });

    describe('get member IDs tests', () => {
        it('should return empty set initially', async () => {
            const expected = { person: {total: 0, count: 0, members: []} };
            const actual = await sut.getMembers();
            expect(actual).toStrictEqual(expected);
        });
        it('should return the member IDs', async () => {
            await sut.postMember(obamaMember, obama);
            await sut.postMember(trumpMember, trump);
            const expected = { person: {total: 2, count: 2, members: [
                `/member?id=${encodeURIComponent(obamaId)}`, 
                `/member?id=${encodeURIComponent(trumpId)}`
            ]} };
            const actual = await sut.getMembers();
            expect(actual).toStrictEqual(expected);
        });
    });

    describe('get member tests', () => {
        it('should fail if ID not found', async () => {
            await sut.postMember(obamaMember, obama);
            const actual = await sut.getMember(trumpId);
            expect(actual).toBeUndefined();
        });
        it('should return the member quads', async () => {
            await sut.postMember(obamaMember, obama);
            const expected = obamaMember;
            const actual = await sut.getMember(obamaId);
            expect(actual).toStrictEqual(expected);
        });
    });

    describe('remove all members', () => {
        it('should remove all members', async () => {
            await sut.postMember(obamaMember, obama);
            await sut.postMember(trumpMember, trump);
            expect(await sut.getIndex()).toStrictEqual({ person: { total: 2 }});
            sut.deleteMembers();
            expect(await sut.getIndex()).toStrictEqual({ person: { total: 0 }});
        });
    });

});


