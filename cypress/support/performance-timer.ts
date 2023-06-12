export class PerformanceTimer {
    private _start: Date;
    private _checkPoint: Date;

    constructor() {
        this._start = new Date();
        this._checkPoint = this._start;
    }

    /** 
     * Returns elapsed time since previous checkpoint in millis.
     */
    public get lap(): number {
        const previousCheckPoint = this._checkPoint;
        this._checkPoint = new Date();
        return this._checkPoint.valueOf() - previousCheckPoint.valueOf();
    }

    /** 
     * Returns elapsed time since start in millis.
     */
    public get end(): number { 
        return new Date().valueOf() - this._start.valueOf();
    }

}