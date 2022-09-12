var jp = require('jsonpath');

interface JsonMapping {
    path: string,
    value: (x: any) => any,
}

export class JsonGenerator {
    private _counter: number = 0;
    private _mapping: JsonMapping[];

    private substituteVariables(format: string, value: any): string {
        var self: any = this;
        return format.replace(/[$]{([^}]+)}/g, (_, variable) => variable == '@' ? value : self[variable] ? self[variable](value) : '');
    }

    constructor(private _template: string, mapping: { [key: string]: string }) {
        this._mapping = Object.keys(mapping).map(key =>
            ({ path: key, value: (x: any) => 
                this.substituteVariables(mapping[key] as string, x) } as JsonMapping));
    }

    public nextCounter(): Number {
        return ++this._counter;
    }

    public currentTimestamp(): string {
        return new Date().toISOString();
    }

    public createNext(): any {
        var next = JSON.parse(this._template);
        this._mapping.forEach(item => { jp.apply(next, item.path, item.value); });
        return next;
    }
}