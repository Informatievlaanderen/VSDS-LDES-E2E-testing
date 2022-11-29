import minimist from 'minimist';
import { Parser, Store } from 'n3';
import fetch from 'node-fetch';
import {SortedQueue} from 'sorted-queue';
import CacheControl from 'cache-control-parser';
const { parse } = CacheControl;

const args = minimist(process.argv.slice(2));
const silent: boolean = (/true/i).test(args['silent'] || 'true');
const mimeType = args['mime-type'] || 'application/n-quads';
const pollInterval = Number.parseInt(args['poll-interval'] || '1000');
const viewUrl = args['follow'];

function showUsage() {
  console.error('usage: node ./dist/index.js --follow=<follow> [--silent=true|false] [--mime-type=<mime-type>] [--poll-interval=<millis>]');
  console.error('\t--follow=<follow>\tview URL of LDES to list all existing fragments and keep following for new ones');
  console.error('\t--silent=true|false\tdefaults to true (shows no debug info)');
  console.error('\t--mime-type=<mime-type>\tmime type to use for fetching LDES, defaults to application/n-quads');
  console.error('\t--poll-interval=<millis>\tpolling interval in milliseconds (to check queue of fragments to visit), defaults to 1000');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function visit(url: string, queue: SortedQueue<TimedUrl>, visited: {[key: string]: any}) {
  const response = mimeType 
  ? await fetch(url, {headers: { accept: mimeType }}) 
  : await fetch(url);

  if (!response.ok) {
    console.error(response.statusText);
    process.exit(response.status);
  }

  const headers = response.headers;
  const cacheControl = parse(headers.get('cache-control') || '');
  const ttl = cacheControl["s-maxage"] ?? cacheControl["max-age"] ?? 0;
  const expires = new Date(Date.now() + ttl * 1000);

  const parser = new Parser({ format: headers.get('content-type') || '' });
  const body = await response.text();
  const model = new Store(parser.parse(body));

  const fragmentId = model.getSubjects(null, 'https://w3id.org/tree#Node', null).shift()?.value;
  if (fragmentId)
  {
    if (!visited[fragmentId]) {
      console.info(fragmentId);
    }
    visited[fragmentId] = true;

    const relations = model.getObjects(null, 'https://w3id.org/tree#node', null).map(x => x.value);
    const unvisited = relations.filter(x => !visited[x]);
    unvisited.forEach(x => queue.push({at: undefined, url: x}));

    const immutable = cacheControl.immutable;
    if (!immutable) {
      queue.push({at: expires, url: fragmentId});
    }
  }
}

if (!viewUrl) {
  showUsage();
  process.exit(-1);
}

if (!silent) {
  console.debug("Arguments: ", args);
}

interface TimedUrl {
  at: Date | undefined;
  url: string;
}

const visitedFragments: {[key: string]: any} = {};
const fragmentsToVisit = new SortedQueue<TimedUrl>((x,y) => { 
  const f = x.at?.valueOf();
  const s = y.at?.valueOf();
  if (!f) return -1;
  if (!s) return 1;
  return s - f;
} );
fragmentsToVisit.push({at: undefined, url: viewUrl});

let next: TimedUrl | undefined;
while (next = fragmentsToVisit.peek()?.value) {
  if (next.at && (Date.now() < next.at.valueOf())) {
    await sleep(pollInterval);
  } else {
    const url = fragmentsToVisit.pop()?.value.url || '';
    await visit(url, fragmentsToVisit, visitedFragments);
  }
}
