import test from 'tape';
import glob from 'glob';
import path from 'path';
import load from 'load-json-file';
import write from 'write-json-file';
import truncate from '@turf/truncate';
import geojsonhint from '@mapbox/geojsonhint';
import circle from '@turf/circle';
import { featureCollection, lineString } from '@turf/helpers';
import destination from '@turf/rhumb-destination';
import ellipse from '.';

test('turf-ellipse', t => {
    glob.sync(path.join(__dirname, 'test', 'in', '*.json')).forEach(filepath => {
        const {name} = path.parse(filepath);
        const geojson = load.sync(filepath);
        const center = geojson.geometry.coordinates;
        let {xSemiAxis, ySemiAxis, steps, angle, units} = geojson.properties;
        angle = angle || 0;
        const options = {steps, angle, units};
        const maxAxis = Math.max(xSemiAxis, ySemiAxis);

        const results = featureCollection([
            truncate(colorize(ellipse(center, xSemiAxis, ySemiAxis, options), '#00F')),
            truncate(colorize(ellipse(center, xSemiAxis, ySemiAxis, {steps, angle: angle + 90, units}), '#0F0')),
            truncate(colorize(circle(center, maxAxis, options), '#F00')),
            destination(center, maxAxis, angle, {units, properties: {'marker-symbol': 'star', 'marker-color': '#F0F'}}),
            destination(center, maxAxis, angle + 90, {units, properties: {'marker-symbol': 'square', 'marker-color': '#F0F'}}),
            lineString([center, destination(center, maxAxis, angle).geometry.coordinates], {stroke: '#F0F', 'stroke-width': 6}),
            lineString([center, destination(center, maxAxis, angle + 90).geometry.coordinates], {stroke: '#F0F', 'stroke-width': 6}),
            geojson,
        ]);

        const out = filepath.replace(path.join('test', 'in'), path.join('test', 'out'));
        if (process.env.REGEN) write.sync(out, results);
        t.deepEqual(results, load.sync(out), name);
    });
    t.end();
});

test('turf-ellipse -- with coordinates', t => {
    t.assert(ellipse([-100, 75], 5, 1));
    t.end();
});

test('turf-ellipse -- validate geojson', t => {
    const E = ellipse([0, 0], 10, 20);
    geojsonhint.hint(E).forEach(hint => t.fail(hint.message));
    t.end();
});

function colorize(feature, color) {
    color = color || '#F00';
    feature.properties['stroke-width'] = 6;
    feature.properties.stroke = color;
    feature.properties.fill = color;
    feature.properties['fill-opacity'] = 0;
    return feature;
}