import fastify from 'fastify'
import { MemberController } from './member-controller';
import minimist from 'minimist'
import { Quad, Parser, Writer } from 'n3';

const server = fastify();

const args = minimist(process.argv.slice(2));
const silent: boolean = args['silent'] !== undefined;
if (!silent) {
  console.debug("Arguments: ", args);
}

const port = args['port'] || 8080;
const host = args['host'] || 'localhost';

const controller = new MemberController();

server.addHook('onRequest', (request, _reply, done) => {
  if (!silent) {
    console.debug(`${request.method} ${request.url}`);
  }
  done();
});


server.addContentTypeParser('application/n-quads', { parseAs: 'string' }, function (_request, body, done) {
  try {
    const parser = new Parser({ format: 'N-Quads' });
    done(null, parser.parse(body as string));
  } catch (error: any) {
    error.statusCode = 400;
    done(error, undefined);
  }
})

server.get('/', (_request, reply) => {
  reply.send({ count: controller.count });
});

server.post('/member', (request, reply) => {
  const quads = request.body as Quad[];
  const id = controller.add(quads);
  reply.status(id ? 201 : 422).send(id || '');
});

function asLocalUrl(id: string) {
  const params = new URLSearchParams();
  params.append('id', id);
  return '/member?' + params.toString();
}

server.get('/member', { schema: { querystring: { id: { type: 'string' } } } }, (request, reply) => {
  const id = (request.query as { id: string }).id;
  if (id) {
    const quads = controller.get(id);
    if (quads) {
      const writer = new Writer({ format: 'application/n-quads' });
      const payload = writer.quadsToString(quads);
      reply.header('Content-Type', 'application/n-quads').send(payload);
    } else {
      reply.status(404).send('');
    }
  }
  else {
    reply.send(controller.ids.map(x => asLocalUrl(x)));
  }
});

server.delete('/member', (_request, reply) => {
  controller.clear();
  reply.status(204).send('');
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
server.listen(options, async (err: any, address: string) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (!silent) {
    console.debug(`Sink listening at ${address}`);
  }
});
