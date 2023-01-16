import { CronJob } from 'cron';
import { readFileSync } from 'fs';
import minimist from 'minimist';
import { JsonGenerator } from './generator.js';
import fetch from 'node-fetch';

const args = minimist(process.argv.slice(2));
const silent: boolean = (/true/i).test(args['silent']);

const cron = args['cron'] || '* * * * * *';
const targetUrl = args['targetUrl'];

let template: string = args['template'] || (args['templateFile'] && readFileSync(args['templateFile'], {encoding: 'utf8'}));
if (!template) throw new Error('Missing template or templateFile');
if (!silent) console.debug('data template: ', template);

let mapping = args['mapping'] || (args['mappingFile'] && readFileSync(args['mappingFile'], {encoding: 'utf8'}));
if (!mapping) throw new Error('Missing mapping or mappingFile');
mapping = JSON.parse(mapping);
if (!silent) console.debug('Mapping: ', mapping);

const generator: JsonGenerator = new JsonGenerator(template, mapping);

const job = new CronJob(cron, async () => {
    const next = generator.createNext();
    const body = JSON.stringify(next);
    if (targetUrl) {
        if (!silent) console.debug('Sending: ', body);
        await fetch(targetUrl, {
            method: 'post',
            body: body,
            headers: {'Content-Type': 'application/json'}
        });
    } else { // if no targetUrl specified, send to console
        console.info(body);
    }
    if (!silent) console.debug('Next run at: ', job.nextDate().toString());
});

if (!silent) console.debug('Runs at: ', cron);
job.start();
