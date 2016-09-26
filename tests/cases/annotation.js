/* Test geo.annotation */

describe('geo.annotation', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
  var restoreVGLRenderer = require('../test-utils').restoreVGLRenderer;

  beforeEach(function () {
    mockVGLRenderer();
  });

  afterEach(function () {
    restoreVGLRenderer();
  });

  function create_map(opts) {
    var node = $('<div id="map"/>').css({width: '640px', height: '360px'});
    $('#map').remove();
    $('body').append(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

  describe('geo.annotation.annotation', function () {
    var map, layer, stateEvent = 0, lastStateEvent;
    it('create', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann instanceof geo.annotation.annotation);
      /* test defaults from various functions */
      expect(ann.type()).toBe('test');
      expect(ann.state()).toBe(geo.annotation.state.done);
      expect(ann.id()).toBeGreaterThan(0);
      expect(ann.name()).toBe('Test ' + ann.id());
      expect(ann.layer()).toBe(undefined);
      expect(ann.features()).toEqual([]);
      expect(ann.coordinates()).toBe(undefined);
      expect(ann.mouseClick()).toBe(undefined);
      expect(ann.mouseMove()).toBe(undefined);
      expect(ann._coordinates()).toEqual([]);
      expect(ann.geojson()).toBe(undefined);
      map = create_map();
      layer = map.createLayer('annotation', {
        annotations: geo.listAnnotations()
      });
      ann = geo.annotation.annotation('test2', {
        layer: layer,
        name: 'Annotation',
        state: geo.annotation.state.create
      });
      expect(ann.type()).toBe('test2');
      expect(ann.state()).toBe(geo.annotation.state.create);
      expect(ann.id()).toBeGreaterThan(0);
      expect(ann.name()).toBe('Annotation');
      expect(ann.layer()).toBe(layer);
      expect(ann.coordinates()).toEqual([]);
    });
    it('_exit', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann._exit()).toBe(undefined);
    });
    it('name', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann.name()).toBe('Test ' + ann.id());
      expect(ann.name('New Name')).toBe(ann);
      expect(ann.name()).toBe('New Name');
      expect(ann.name('')).toBe(ann);
      expect(ann.name()).toBe('New Name');
    });
    it('layer', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann.layer()).toBe(undefined);
      expect(ann.layer(layer)).toBe(ann);
      expect(ann.layer()).toBe(layer);
    });
    it('state', function () {
      var ann = geo.annotation.annotation('test', {layer: layer});
      map.geoOn(geo.event.annotation.state, function (evt) {
        stateEvent += 1;
        lastStateEvent = evt;
      });
      expect(ann.state()).toBe(geo.annotation.state.done);
      expect(ann.state(geo.annotation.state.create)).toBe(ann);
      expect(stateEvent).toBe(1);
      expect(lastStateEvent.annotation).toBe(ann);
      expect(ann.state()).toBe(geo.annotation.state.create);
      expect(ann.state(geo.annotation.state.create)).toBe(ann);
      expect(stateEvent).toBe(1);
      expect(ann.state(geo.annotation.state.done)).toBe(ann);
      expect(stateEvent).toBe(2);
      expect(ann.state()).toBe(geo.annotation.state.done);
    });
    it('options', function () {
      var ann = geo.annotation.annotation('test', {layer: layer, testopt: 30});
      expect(ann.options().testopt).toBe(30);
      expect(ann.options('testopt')).toBe(30);
      expect(ann.options('testopt', 40)).toBe(ann);
      expect(ann.options().testopt).toBe(40);
      expect(ann.options({testopt: 30})).toBe(ann);
      expect(ann.options().testopt).toBe(30);
    });
    it('coordinates', function () {
      var ann = geo.annotation.annotation('test', {layer: layer});
      var coord = [{x: 10, y: 30}, {x: 20, y: 25}];
      ann._coordinates = function () {
        return coord;
      };
      expect(ann.coordinates().length).toBe(2);
      expect(ann.coordinates(null)[0].x).toBeCloseTo(10);
      expect(ann.coordinates()[0].x).not.toBeCloseTo(10);
    });
    it('modified', function () {
      var ann = geo.annotation.annotation('test', {layer: layer});
      var buildTime = layer.getMTime();
      ann.modified();
      expect(layer.getMTime()).toBeGreaterThan(buildTime);
    });
    it('draw', function () {
      var oldDraw = layer.draw, drawCalled = 0;
      layer.draw = function () {
        drawCalled += 1;
      };
      var ann = geo.annotation.annotation('test', {layer: layer});
      ann.draw();
      expect(drawCalled).toBe(1);
      layer.draw = oldDraw;
    });
  });

  describe('geo.annotation.rectangleAnnotation', function () {
    var corners = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}];
    it('create', function () {
      var ann = geo.annotation.rectangleAnnotation();
      expect(ann instanceof geo.annotation.rectangleAnnotation);
      expect(ann.type()).toBe('rectangle');
    });
    it('features', function () {
      var ann = geo.annotation.rectangleAnnotation({corners: corners});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].polygon.polygon).toEqual(corners);
      expect(features[0].polygon.style.fillOpacity).toBe(0.25);
    });
    it('_coordinates', function () {
      var ann = geo.annotation.rectangleAnnotation({corners: corners});
      expect(ann._coordinates()).toEqual(corners);
    });
  });

  describe('geo.annotation.polygonAnnotation', function () {
    var vertices = [{x: 30, y: 0}, {x: 50, y: 0}, {x: 40, y: 20}, {x: 30, y: 10}];
    it('create', function () {
      var ann = geo.annotation.polygonAnnotation();
      expect(ann instanceof geo.annotation.polygonAnnotation);
      expect(ann.type()).toBe('polygon');
    });
    it('features', function () {
      var ann = geo.annotation.polygonAnnotation({vertices: vertices});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].polygon.polygon).toEqual(vertices);
      expect(features[0].polygon.style.fillOpacity).toBe(0.25);
      expect(features[0].polygon.style.fillColor.g).toBe(1);
      expect(features[0].polygon.style.polygon({polygon: 'a'})).toBe('a');
      ann.state(geo.annotation.state.create);
      features = ann.features();
      expect(features.length).toBe(3);
      expect(features[0]).toBe(undefined);
      expect(features[1].polygon.polygon).toEqual(vertices);
      expect(features[1].polygon.style.fillOpacity).toBe(0.25);
      expect(features[1].polygon.style.fillColor.g).toBe(0.3);
      expect(features[1].polygon.style.polygon({polygon: 'a'})).toBe('a');
      expect(features[2].line.line).toEqual(vertices);
      expect(features[2].line.style.fillOpacity).toBe(0.25);
      expect(features[2].line.style.fillColor.g).toBe(0.3);
      ann.options('vertices', [{x: 3, y: 0}, {x: 5, y: 0}]);
      features = ann.features();
      expect(features.length).toBe(3);
      expect(features[0]).toBe(undefined);
      expect(features[1]).toBe(undefined);
      expect(features[2].line.line.length).toBe(2);
    });
    it('_coordinates', function () {
      var ann = geo.annotation.polygonAnnotation({vertices: vertices});
      expect(ann._coordinates()).toEqual(vertices);
    });
    it('mouseMove', function () {
      var ann = geo.annotation.polygonAnnotation({vertices: vertices});
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(undefined);
      expect(ann.options('vertices')).toEqual(vertices);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(true);
      expect(ann.options('vertices')).not.toEqual(vertices);
    });
    it('mouseClick', function () {
      var map = create_map();
      var layer = map.createLayer('annotation', {
        annotations: ['polygon']
      });
      var ann = geo.annotation.polygonAnnotation({layer: layer});
      var time = new Date().getTime();
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      })).toBe(undefined);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {middle: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(undefined);
      expect(ann.options('vertices').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(undefined);
      expect(ann.options('vertices').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(true);
      expect(ann.options('vertices').length).toBe(2);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[1],
        mapgcs: map.displayToGcs(vertices[1], null)
      });
      expect(ann.options('vertices').length).toBe(3);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[2],
        mapgcs: map.displayToGcs(vertices[2], null)
      });
      expect(ann.options('vertices').length).toBe(4);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: vertices[0].x + 1, y: vertices[0].y},
        mapgcs: map.displayToGcs({x: vertices[0].x + 1, y: vertices[0].y}, null)
      })).toBe('done');
      expect(ann.options('vertices').length).toBe(3);
      expect(ann.state()).toBe(geo.annotation.state.done);
    });
  });

  describe('geo.annotation.pointAnnotation', function () {
    var point = {x: 30, y: 25};

    it('create', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann instanceof geo.annotation.pointAnnotation);
      expect(ann.type()).toBe('point');
    });
    it('features', function () {
      var ann = geo.annotation.pointAnnotation({position: point});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].point.x).toEqual(point.x);
      expect(features[0].point.style.radius).toBe(10);
      ann.state(geo.annotation.state.create);
      features = ann.features();
      expect(features.length).toBe(0);
    });
    it('_coordinates', function () {
      var ann = geo.annotation.pointAnnotation({position: point});
      expect(ann._coordinates()).toEqual([point]);
      ann.state(geo.annotation.state.create);
      expect(ann._coordinates()).toEqual([]);
    });
    it('mouseClick', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        map: {x: 10, y: 20},
        mapgcs: {x: 10, y: 20}
      })).toBe(undefined);
      expect(ann.options('position')).toBe(undefined);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        map: {x: 10, y: 20},
        mapgcs: {x: 10, y: 20}
      })).toBe(undefined);
      expect(ann.options('position')).toBe(undefined);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        map: {x: 10, y: 20},
        mapgcs: {x: 10, y: 20}
      })).toBe('done');
      expect(ann.options('position')).toEqual({x: 10, y: 20});
      expect(ann.state()).toBe(geo.annotation.state.done);
    });
  });

  describe('annotation registry', function () {
    var newshapeCount = 0;
    it('listAnnotations', function () {
      var list = geo.listAnnotations();
      expect($.inArray('rectangle', list) >= 0).toBe(true);
      expect($.inArray('polygon', list) >= 0).toBe(true);
      expect($.inArray('point', list) >= 0).toBe(true);
      expect($.inArray('unknown', list) >= 0).toBe(false);
    });
    it('registerAnnotation', function () {
      var func = function () { newshapeCount += 1; return 'newshape return'; };
      expect($.inArray('newshape', geo.listAnnotations()) >= 0).toBe(false);
      expect(geo.registerAnnotation('newshape', func)).toBe(undefined);
      expect($.inArray('newshape', geo.listAnnotations()) >= 0).toBe(true);
      expect(geo.registerAnnotation('newshape', func).func).toBe(func);
      expect($.inArray('newshape', geo.listAnnotations()) >= 0).toBe(true);
    });
    it('createAnnotation', function () {
      expect(geo.createAnnotation('unknown')).toBe(undefined);
      expect(newshapeCount).toBe(0);
      expect(geo.createAnnotation('newshape')).toBe('newshape return');
      expect(newshapeCount).toBe(1);
    });
    it('featuresForAnnotations', function () {
      var features = geo.featuresForAnnotations(['polygon']);
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations({polygon: true});
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations({polygon: [geo.annotation.state.done]});
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(false);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations({polygon: [geo.annotation.state.done, geo.annotation.state.create]});
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations(['polygon', 'point']);
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(true);
      features = geo.featuresForAnnotations(['polygon', 'unknown']);
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
    });
    it('rendererForAnnotations', function () {
      expect(geo.rendererForAnnotations(['polygon'])).toBe('vgl');
      expect(geo.rendererForAnnotations(['point'])).toBe('vgl');
      geo.gl.vglRenderer.supported = function () { return false; };
      expect(geo.rendererForAnnotations(['polygon'])).toBe(false);
      expect(geo.rendererForAnnotations(['point'])).toBe('d3');
    });
  });
});
