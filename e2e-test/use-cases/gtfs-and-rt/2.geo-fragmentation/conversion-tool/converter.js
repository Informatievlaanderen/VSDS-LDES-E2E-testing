import {parse, stringify} from 'wellknown';

const convertPoint = function(point) {
    const x = point[0];
    const y = point[1];
    const n = 0.77164219;
    const F = 1.81329763;
    const thetaFudge = 0.00014204;
    const e = 0.08199189;
    const a = 6378388;
    const xDiff = 149910;
    const yDiff = 5400150;
    const theta0 = 0.07604294;
    const xReal = xDiff - x;
    const yReal = yDiff - y;
    const rho = Math.sqrt(xReal * xReal + yReal * yReal);
    const theta = Math.atan(xReal / -yReal);
    const newLongitude = (theta0 + (theta + thetaFudge) / n) * 180 / Math.PI;
    var newLatitude = 0;

    for (let i = 0; i < 5; i++) {
        newLatitude = (2 * Math.atan(Math.pow(F * a / rho, 1 / n) * Math.pow((1 + e * Math.sin(newLatitude)) / (1 - e * Math.sin(newLatitude)), e / 2))) - Math.PI / 2;
    }

    newLatitude *= 180 / Math.PI;
    return [newLongitude, newLatitude];
}

// TOD: add tests before enabling alternative types
const convertGeometry = function(geometry) {
    switch(geometry.type) {
        // case "GeometryCollection": {
        //     geometry.geometries.forEach(g => convertGeometry(g));
        //     break;
        // }
        // case "Point": {
        //     geometry.coordinates = convertPoint(geometry.coordinates);
        //     break;
        // }
        // case "LineString": 
        // case "MultiPoint": {
        //     geometry.coordinates = geometry.coordinates.map(c => convertPoint(c));
        //     break;
        // }
        // case "MultiLineString": 
        case "Polygon": {
            geometry.coordinates.forEach((a,i) => { geometry.coordinates[i] = a.map(c => convertPoint(c))});
            break;
        }
        // case "MultiPolygon": {
        //     geometry.coordinates.forEach(a => { a.forEach((p,i) => {a[i] = p.map(c => convertPoint(c))})});
        //     break;
        // }
        default: {
            throw Error(`geometry of type '${geometry.type}' not supported`);
        }
    }
    return geometry;
}

const lambert72Tag = '<http://www.opengis.net/def/crs/EPSG/9.9.1/31370>';
export function convertWkt(wkt) {
    if(!wkt.startsWith(lambert72Tag)) throw Error('wkt is not in Lambert 72 (ESPG:31370)');
    wkt = wkt.replace(lambert72Tag, '').trim();

    const geometry = parse(wkt);
    if (!geometry) throw Error('wkt is not a valid geometry');
    
    const converted = convertGeometry(geometry);
    return stringify(converted);
}