import fastify from 'fastify'
import minimist from 'minimist'
import { MongoClient } from "mongodb";

const server = fastify();

const args = minimist(process.argv.slice(2));
const silent: boolean = (/true/i).test(args['silent']);
if (!silent) {
  console.debug("Arguments: ", args);
}

const port = args['port'] || 9000;
const host = args['host'] || 'localhost';
const connectionUri = args['connection-uri'] || 'mongodb://localhost:27017';

const mongo = new MongoClient(connectionUri);

server.addHook('onReady', async () => {
  await mongo.connect();
});

server.addHook('onClose', async () => {
  await mongo.close();
})

server.addHook('onResponse', (request, reply, done) => {
  if (!silent) {
    const method = request.method;
    const statusCode = reply.statusCode;
    console.debug(method === 'POST' 
      ? `${method} ${request.url} ${request.headers['content-type']} ${statusCode}` 
      : `${method} ${request.url} ${statusCode}`);
  }
  done();
});

interface CountParameters {
  database: string;
  collection: string;
}

interface Record {
  _id: string; // required for MongoDB
}

server.get('/:database/:collection', { schema: { querystring: { includeIds: { type: 'string' } } } }, async (request, reply) => {
  const queryString = (request.query as { includeIds: string });
  const includeIds : boolean = (/true/i).test(queryString.includeIds);
  const parameters = request.params as CountParameters;
  const collection = mongo.db(parameters.database).collection(parameters.collection);
  const count = await collection.estimatedDocumentCount({});
  const ids = includeIds 
    ? await collection.find<Record>({}, {}).sort({ _id: 1 }).toArray().then(x => x.map(x => x._id))  // get all IDs sorted ascending
    : undefined ;
  reply.send(includeIds ? {count: count, ids: ids} : {count: count});
});

async function closeGracefully(signal: any) {
  if (!silent) {
    console.debug(`Received signal: `, signal);
  }
  await server.close();
  process.exitCode = 0;
}

process.on('SIGINT', closeGracefully);

function exitWithError(err: any) {
  console.error(err);
  process.exit(1);
}

const options = { port: port, host: host };
server.listen(options, async (err: any, address: string) => {
  if (err) {
    exitWithError(err);
  }
  if (!silent) {
    console.debug(`MongoDB REST API listening at ${address}`);
  }
});
