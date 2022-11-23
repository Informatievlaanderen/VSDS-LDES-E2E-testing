import { LdesFragmentController, LdesFragmentRepository, LdesFragmentService, IAlias, TreeNode, TreeRelation, IHeaders } from '../src'

describe('controller tests', () => {
    const mimeJsonLd = 'application/ld+json';
    const originalBaseUrl = new URL('http://www.example.org');
    const controllerBaseUrl = new URL("http://www.ldes-server-simulator.org");
    const firstPartialId = '/id/fragment/1';
    const secondPartialId = '/id/fragment/2';
    const thirdPartialId = '/id/fragment/3';
    const body = {
        '@id': new URL(firstPartialId, originalBaseUrl).href,
        "tree:relation": [
            { "tree:node": new URL(secondPartialId, originalBaseUrl).href } as TreeRelation,
            { "tree:node": new URL(thirdPartialId, originalBaseUrl).href } as TreeRelation,
        ]
    } as TreeNode;
    const headers: IHeaders = {'content-type': mimeJsonLd};
    const partialWithQueryId = '/fragment?id=1';
    const queryIdAlias: IAlias = {
        alias: new URL(partialWithQueryId, originalBaseUrl).href,
        original: new URL(firstPartialId, originalBaseUrl).href
    };

    let sut: LdesFragmentController;
    let repository: LdesFragmentRepository;

    beforeEach(() => {
        repository = new LdesFragmentRepository();
        sut = new LdesFragmentController(new LdesFragmentService(controllerBaseUrl, repository));
    });

    describe('get statistics tests', () => {
        it('should initially return empty statistics', () => {
            const statistics = sut.getStatistics();
            expect(statistics.body).not.toBe(undefined);
            expect(statistics.body.aliases).toHaveLength(0);
            expect(statistics.body.fragments).toHaveLength(0);
        });
        it('should return correct statistics', () => {
            sut.postFragment({body: body, headers: headers});
            sut.postAlias({body: queryIdAlias});
            const statistics = sut.getStatistics();
            expect(statistics.body).not.toBe(undefined);
            expect(statistics.body.aliases).toEqual([partialWithQueryId]);
            expect(statistics.body.fragments).toEqual([firstPartialId]);
            expect(statistics.body.responses).toStrictEqual({});
        });
        it('should update response statistics', () => {
            sut.postFragment({body: body, headers: headers});
            sut.postAlias({body: queryIdAlias});
            sut.getFragment({query: {id: queryIdAlias.original}});

            const now = new Date();
            const statistics = sut.getStatistics();
            expect(statistics.body).not.toBe(undefined);
            expect(statistics.body.responses).not.toBe(undefined);

            const firstStatistics = statistics.body.responses[queryIdAlias.original];
            expect(firstStatistics).not.toBe(undefined);
            expect(firstStatistics?.count).toBe(1);
            expect(firstStatistics?.at.length).toBe(1);

            const expectedAtRoundedToSeconds = now.valueOf()/1000;
            const actualAtRoundedToSeconds = (firstStatistics?.at?.[0]?.valueOf() ?? 0)/1000;
            expect(actualAtRoundedToSeconds).toBeCloseTo(expectedAtRoundedToSeconds, 0);
        });
    });

    describe('store fragment tests', () => {
        it('should store the fragment with headers', () => {
            const fragmentInfo = sut.postFragment({body: body, headers: headers});
            expect(fragmentInfo.body).not.toBe(undefined);
            expect(fragmentInfo.body.id).toBe(firstPartialId);

            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.headers).toEqual({...headers, "cache-control": "public, max-age=604800, immutable"});
        });
        it('should replace the fragment ID', () => {
            sut.postFragment({body: body, headers: headers});
            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.content).not.toBeUndefined();
            expect(fragment?.content?.['@id']).toBe(new URL(firstPartialId, controllerBaseUrl).href);
        });
        it("should replace the relation's node ID", () => {
            sut.postFragment({body: body, headers: headers});
            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.content?.['tree:relation'].length).toBe(body['tree:relation'].length);
            expect(fragment?.content?.['tree:relation'].map(x => x['tree:node'])).toEqual([
                new URL(secondPartialId, controllerBaseUrl).href,
                new URL(thirdPartialId, controllerBaseUrl).href
            ]);
        });
    });

    describe('retrieve fragment tests', () => {
        it('should return stored fragment on request', () => {
            repository.save(firstPartialId, body, {'content-type': mimeJsonLd});
            const fragment = sut.getFragment({query: {id: firstPartialId}});
            expect(fragment.body).not.toBeUndefined();
            expect(fragment.body?.['@id']).toBe(body['@id']);
        });
        it('should return 404 if fragment not found', () => {
            const fragment = sut.getFragment({query: {id: '/dummy/id'}});
            expect(fragment.body).toBeUndefined();
            expect(fragment.status).toBe(404);
        });
    });

    describe('redirection tests', () => {
        it('should store alias', () => {
            const redirect = sut.postAlias({body: queryIdAlias});
            expect(redirect.body).not.toBeUndefined();
            expect(redirect.body).toEqual({from: partialWithQueryId, to: firstPartialId});
        });
        it('should retrieve fragments by alias', () => {
            sut.postFragment({body: body, headers: headers});
            sut.postAlias({body: queryIdAlias});
            const fragment = sut.getFragment({query: {id: firstPartialId}});
            expect(fragment.body).not.toBeUndefined();
            expect(fragment.body?.['@id']).toBe(body['@id']);
        });
        it('should retrieve fragments by alias, even recursively', () => {
            sut.postFragment({body: body, headers: headers});
            sut.postAlias({body: queryIdAlias});

            const firstMemberId = '/fragment/first';
            const firstMemberAlias: IAlias = {
                alias: new URL(firstMemberId, originalBaseUrl).href,
                original: new URL(partialWithQueryId, originalBaseUrl).href
            };
            sut.postAlias({body: firstMemberAlias});
            const fragment = sut.getFragment({query: {id: firstMemberId}});
            expect(fragment.body).not.toBeUndefined();
            expect(fragment.body?.['@id']).toBe(body['@id']);
        });
    });

    describe('seed tests', () => {
        it('should serve seeded data', async () => {
            await sut.seed('./test/data');
            expect(sut.getFragment({query: {id: '/id/fragment/1'}})).not.toBeUndefined();
            expect(sut.getFragment({query: {id: '/id/fragment/2'}})).not.toBeUndefined();
        });
    });

    describe('Cache-Control tests', () => {
        it('should return immutable by default', () => {
            sut.postFragment({body: body, headers: headers});
            const fragment = sut.getFragment({query: {id: firstPartialId}});
            expect(fragment.headers).not.toBeUndefined();

            const cacheControl = fragment.headers && fragment.headers['cache-control'] as string;
            expect(cacheControl).not.toBeUndefined();

            const directives = cacheControl?.split(',').map(x => x.trim());
            expect(directives).toContain('public');
            expect(directives).toContain('immutable');
            expect(directives).toContain('max-age=604800');
        });
        it('should return correct cache control when passing validity seconds (max-age)', () => {
            const seconds = 5;
            sut.postFragment({body: body, headers: headers, query: {'max-age': seconds}});
            
            const fragment = sut.getFragment({query: {id: firstPartialId}});
            const cacheControl = fragment.headers && fragment.headers['cache-control'] as string;
            
            const directives = cacheControl?.split(',').map(x => x.trim());
            expect(directives).toContain('public');
            expect(directives).not.toContain('immutable');
            
            const maxAge = directives?.find(x => x.startsWith('max-age='));
            expect(maxAge).not.toBeUndefined();

            const age = maxAge ? Number.parseInt(maxAge?.replace('max-age=', '')) : undefined;
            expect(age).toBe(seconds);
        });
    });
});
