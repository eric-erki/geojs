/* globals utils */

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();
  var inPan, animationQueue = [];

  var map1Params = {
    center: {x: -98.50, y: 29.42},  // San Antonio, Texas
    node: '#map1'
  };
  var map2Params = {
    center: {x: 28.28, y: -15.43},  // Lusaka, Zambia
    node: '#map2'
  };

  // parameters to apply to both maps.
  var mapParams = {
    zoom: 8
  };

  // Once loaded, create our maps.  The two maps are centered on each other,
  // so we can always use the same center, zoom, and rotation.
  var params1 = $.extend(true, {}, mapParams, map1Params);
  // link animations between the maps.  This ensures the two maps update in the
  // same animation frame.  If we don't share the animationQueue, there could
  // be a slight lag between the maps
  params1.animationQueue = animationQueue;
  var map1 = geo.map(params1);
  map1.createLayer('osm');

  var params2 = $.extend(true, {}, mapParams, map2Params);
  // link animations between the maps
  params2.animationQueue = animationQueue;
  var map2 = geo.map(params2);
  map2.createLayer('osm', {
    // if ?satellite=true is added to the query, show a different tile source
    // for the second map.
    url: !query.satellite ? undefined :
      'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
    attribution: !query.satellite ? undefined :
      'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community'
  });

  // Link the two maps together
  map1.geoOn(geo.event.pan, function (evt) {
    // record that we are in a pan event for the first map.  This prevents
    // getting into an endless loop
    if (inPan !== 2) {
      inPan = 1;
      map2.zoom(map1.zoom());
      map2.rotation(map1.rotation());
      // Make sure the centers are offset the same amount in pixel coordinates.
      // We could have displaced the same amount in lat / lon, but those are
      // non-linear in our default map projection.
      var center1 = map1.gcsToDisplay(map1Params.center),
          center2 = map2.gcsToDisplay(map2Params.center);
      map2.pan({x: center1.x - center2.x, y: center1.y - center2.y});

      inPan = 0;
    }
  });

  map2.geoOn(geo.event.pan, function (evt) {
    // record that we are in a pan event for the second map.  This prevents
    // getting into an endless loop
    if (inPan !== 1) {
      inPan = 2;
      map1.zoom(map2.zoom());
      map1.rotation(map2.rotation());
      var center1 = map1.gcsToDisplay(map1Params.center),
          center2 = map2.gcsToDisplay(map2Params.center);
      map1.pan({x: center2.x - center1.x, y: center2.y - center1.y});
      inPan = 0;
    }
  });

  // turn off focus highlighting
  var opts;

  opts = map1.interactor().options();
  opts.keyboard.focusHighlight = false;
  map1.interactor().options(opts);
  opts = map2.interactor().options();
  opts.keyboard.focusHighlight = false;
  map2.interactor().options(opts);
});
