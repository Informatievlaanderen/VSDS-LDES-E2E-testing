import fastify, { FastifyReply } from 'fastify'
import minimist from 'minimist'
import { LdesFragmentRepository } from './ldes-fragment-repository';
import { ICreateFragmentOptions, LdesFragmentService } from './ldes-fragment-service';
import { LdesFragmentController } from "./ldes-fragment-controller";
import { TreeNode } from './tree-specification';
import { IResponse } from './http-interfaces';
import { RouteGenericInterface } from 'fastify/types/route';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { IAlias } from './fragment-interfaces';

const server = fastify({exposeHeadRoutes: true});
const args = minimist(process.argv.slice(2));
const silent: boolean = args['silent'] !== undefined;

if (!silent) {
  console.debug("arguments: ", args);
}
const port = args['port'] || 80;
const host = args['host'] || 'localhost';
const baseUrl = new URL(args['baseUrl'] || `http://${host}:${port}`);
const repository = new LdesFragmentRepository();
const service = new LdesFragmentService(baseUrl, repository);
const controller = new LdesFragmentController(service);

server.addHook('onRequest', (request, _reply, done) => {
  if (!silent) {
    console.debug(`${request.method} ${request.url}`);
  }
  done();
});

function respondWith<T>(reply: FastifyReply<Server, IncomingMessage, ServerResponse, RouteGenericInterface, unknown>, response: IResponse<T>) {
  reply.status(response.status).headers(response.headers || {}).send(response.body);
}

server.get('/', async (_request, reply) => {
  respondWith(reply, controller.getStatistics());
});

server.get('/*', async (request, reply) => {
  const baseUrl = new URL(`${request.protocol}://${request.hostname}`);
  respondWith(reply, controller.getFragment({ query: {id: request.url }}, baseUrl));
});

server.addContentTypeParser('application/ld+json', {parseAs: "string"}, server.getDefaultJsonParser('ignore', 'ignore'));

server.post('/ldes', {schema: {querystring: {seconds: {type:'number'}}}}, async (request, reply) => {
  respondWith(reply, controller.postFragment({
    body: request.body as TreeNode, 
    query: request.query as ICreateFragmentOptions,
    headers: {'content-type': request.headers['content-type']}
  }));
});

server.post('/alias', async (request, reply) => {
  respondWith(reply, controller.postAlias({body: request.body as IAlias}));
});

server.delete('/ldes', async (_request, reply) => {
  respondWith(reply, controller.deleteAll());
});

async function closeGracefully(signal: any) {
  if (!silent) {
    console.debug(`Received signal: `, signal);
  }
  await server.close();
  process.exitCode = 0;
}

process.on('SIGINT', closeGracefully);

const options = { port: port, host: host };
server.listen(options, async (err, address) => {
  if (args['seed']) {
    try {
      (await controller.seed(args['seed'])).forEach(x => {
        if (!silent) {
          console.debug(`seeded with file '${x.file}' containg fragment '${x.fragment}'`);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (err) {
    console.error(err)
    process.exit(1)
  }
  if (!silent) {
    console.log(`Simulator listening at ${address}`);
  }
});
