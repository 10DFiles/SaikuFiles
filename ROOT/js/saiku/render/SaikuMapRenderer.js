/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * Class to render map
 *
 * @class SaikuMapRenderer
 * @chainable
 * @return {SaikuMapRenderer} The SaikuMapRenderer instance (for chaining)
 */
var SaikuMapRenderer = (function() {
	'use strict';

	/**
	 * That constructor enforces the use of new, even if you call the constructor like a function
	 *
	 * @constructor
	 * @private
	 * @param {Object} args Saiku data, map type (map_geo, map_heat or map_marker) and properties of map
	 */
	function SaikuMapRenderer(args) {
		// enforces new
		if (!(this instanceof SaikuMapRenderer)) {
			return new SaikuMapRenderer(args);
		}

		args = Array.prototype.slice.call(arguments);

		var saikuChartRenderer;
		var dataTree;
		var mapType;
		var mapProperties;
		var positions;

		this._idMap = _.uniqueId('map-');

		if (args[3] === 'run_workspace_map') {
	        // Initialize properties
	        _.extend(this, args[0]);

	        this._runWorkspaceMap = true;

	        if (args[0].data) {
				this._data = args[0].data.rawdata;
			}
			else {
				this._data = args[0].renderer.rawdata;
			}

			this._el = function() {
				return {
					//      v--------------  Not change for this.renderer.$el
					canvas: $(this.renderer.el).find('.canvas_wrapper')
				}
			};

			this._workspaceSize = function() {
				return {
			        width: this.workspace.$el.find('.workspace_results').width(),
			        height: this.workspace.$el.find('.workspace_results').height()
				}
			};

			saikuChartRenderer = new SaikuChartRenderer(null, {});
			dataTree = saikuChartRenderer.process_data_tree({ data: this._data }, true, true);
			mapType = args[1];
			mapProperties = args[2];
			positions = getPositionColumn(dataTree, mapType, mapProperties);

			this._data = processData(dataTree, mapType, positions);
			this._data.mapType = mapType;
			this._data.mapProperties = mapProperties;
			this.adjust();

			Saiku.session.bind('tab:select', this.adjustTrigger);
		}
		else {
	        // Initialize properties
	        _.extend(this, args[0]);

			this._data = args[0];
			this._options = args[1];
			
			this._el = function() {
				return {
					canvas: $(this._options.htmlObject)
				}
			};

			this._workspaceSize = function() {
				return {
			        width: (this._el().canvas.width() + 10),
			        height: (this._el().canvas.height() + 10)
				}
			};

			saikuChartRenderer = new SaikuChartRenderer(null, {});
			dataTree = saikuChartRenderer.process_data_tree({ data: this._data }, true, true);

			if (args && args[1] && _.has(args[1], 'mapDefinition')) {
				mapType = args[1].mapDefinition.mapDefinition.type;
				mapProperties = args[1].mapDefinition;
			}
			else {
				mapType = args[0].query.properties['saiku.ui.render.type'];
				mapProperties = args[0].query.properties['saiku.ui.map.options'];
			}

			positions = getPositionColumn(dataTree, mapType, mapProperties);

			this._data = processData(dataTree, mapType, positions);
			this._data.mapType = mapType;
			this._data.mapProperties = mapProperties;
		}
	}

	/**
	 * Get position of column
	 *
	 * @method getPositionColumn
	 * @private
	 * @param  {Object} data          Saiku data
	 * @param  {String} mapType       Map type (map_geo, map_heat or map_marker)
	 * @param  {Object} mapProperties Properties of map
	 * @return {Object}               Positions of column
	 */
	function getPositionColumn(data, mapType, mapProperties) {
		var metadata = data.metadata;
		var aux = 0;
		var i = 0;
		var positions = {};
		var fields;
		var lenFields;

		if (mapType === 'map_heat') {
			positions.fields = [];

			if (mapProperties.mapDefinition.latfield === null || mapProperties.mapDefinition.latfield === undefined) {
				fields = [];
				if (mapProperties.mapDefinition.search.street !== undefined && mapProperties.mapDefinition.search.street !== '') {
					fields.push({ 'name': 'street', 'val': mapProperties.mapDefinition.search.street });
				}
				if (mapProperties.mapDefinition.search.city !== undefined && mapProperties.mapDefinition.search.city !== '') {
					fields.push({ 'name': 'city', 'val': mapProperties.mapDefinition.search.city });
				}
				if (mapProperties.mapDefinition.search.county !== undefined && mapProperties.mapDefinition.search.county !== '') {
					fields.push({ 'name': 'county', 'val': mapProperties.mapDefinition.search.county });
				}
				if (mapProperties.mapDefinition.search.state !== undefined && mapProperties.mapDefinition.search.state !== '') {
					fields.push({ 'name': 'state', 'val': mapProperties.mapDefinition.search.state });
				}
				if (mapProperties.mapDefinition.search.country !== undefined && mapProperties.mapDefinition.search.country !== '') {
					fields.push({ 'name': 'country', 'val': mapProperties.mapDefinition.search.country });
				}
			}
			else {
				fields = [];
				fields.push({ 'name': 'lat', 'val': mapProperties.mapDefinition.latfield });
				fields.push({ 'name': 'lon', 'val': mapProperties.mapDefinition.lonfield });
			}

			mapProperties.lookupfields = fields;
			lenFields = fields ? fields.length : 0;

			while (aux < lenFields) {
				if (metadata[i] && (metadata[i].colName === fields[aux].val)) {
					positions.fields.push(metadata[i]);
					i = 0; 
					aux++;
				}
				else {
					i++;
				}
			}
		}
		else if (mapType === 'map_marker') {
			var lenMetadata = metadata ? metadata.length : 0;

			positions.fields = [];
			positions.metric = '';

			if (mapProperties.mapDefinition.latfield === null || mapProperties.mapDefinition.latfield === undefined) {
				fields = [];
				if (mapProperties.mapDefinition.search.street !== undefined && mapProperties.mapDefinition.search.street !== '') {
					fields.push({ 'name': 'street', 'val': mapProperties.mapDefinition.search.street });
				}
				if (mapProperties.mapDefinition.search.city !== undefined && mapProperties.mapDefinition.search.city !== '') {
					fields.push({ 'name': 'city', 'val': mapProperties.mapDefinition.search.city });
				}
				if (mapProperties.mapDefinition.search.county !== undefined && mapProperties.mapDefinition.search.county !== '') {
					fields.push({ 'name': 'county', 'val': mapProperties.mapDefinition.search.county });
				}
				if (mapProperties.mapDefinition.search.state !== undefined && mapProperties.mapDefinition.search.state !== '') {
					fields.push({ 'name': 'state', 'val': mapProperties.mapDefinition.search.state });
				}
				if (mapProperties.mapDefinition.search.country !== undefined && mapProperties.mapDefinition.search.country !== '') {
					fields.push({ 'name': 'country', 'val': mapProperties.mapDefinition.search.country });
				}
			}
			else {
				fields = [];
				fields.push({ 'name': 'lat', 'val': mapProperties.mapDefinition.latfield });
				fields.push({ 'name': 'lon', 'val': mapProperties.mapDefinition.lonfield });
			}

			mapProperties.lookupfields = fields;
			lenFields = fields ? fields.length : 0;
			
			while (aux < lenFields) {
				if (metadata[i] && (metadata[i].colName === fields[aux].val)) {
					positions.fields.push(metadata[i]);
					i = 0; 
					aux++;
				}
				else {
					i++;
				}
			}

			for (i = 0; i < lenMetadata; i++) {
				if (metadata[i].colName === mapProperties.mapDefinition.metric) {
					positions.metric = metadata[i];
				}
			}
		}
		
		return positions;
	}

	/**
	 * Method for organizing Saiku data
	 *
	 * @method processData
	 * @private
	 * @param  {Object} data      Saiku data
	 * @param  {String} mapType   Map type (map_geo, map_heat or map_marker)
	 * @param  {Object} positions Positions of column
	 * @return {Object}           Data for work in maps
	 */
	function processData(data, mapType, positions) {
		var newData = {
			names: [],
			groupNames: [],
			values: [],
			groupValues: []
		};
		var lenResultset = data.resultset ? data.resultset.length : 0;
		var lenFields = positions.fields ? positions.fields.length : 0;
		var nameRaw = '';
		var valuesRaw = [];
		var i, j;

		if (mapType === 'map_heat') {
			for (i = 0; i < lenResultset; i++) {
				if (positions.fields.length > 1) {
					for (j = 0; j < lenFields; j++) {
						if (_.isEmpty(nameRaw)) {
							nameRaw = data.resultset[i][positions.fields[j].colIndex];
						}
						else {
							nameRaw += ', ';
							nameRaw += data.resultset[i][positions.fields[j].colIndex];
						}
					}

					newData.names.push(nameRaw);
					nameRaw = '';
				}
				else {
					if (positions.fields) {
						newData.names.push(data.resultset[i][positions.fields[0].colIndex]);
						nameRaw = data.resultset[i][positions.fields[0].colIndex];

						if (data.resultset[i+1] && (nameRaw === data.resultset[i+1][positions.fields[0].colIndex])) {
						}
						else {
							newData.groupNames.push(nameRaw);
							nameRaw = '';
						}
					}
				}
			}
		}
		else if (mapType === 'map_marker') {
			for (i = 0; i < lenResultset; i++) {
				if (positions.fields.length > 1) {
					for (j = 0; j < lenFields; j++) {
						if (_.isEmpty(nameRaw)) {
							nameRaw = data.resultset[i][positions.fields[j].colIndex];
						}
						else {
							nameRaw += ', ';
							nameRaw += data.resultset[i][positions.fields[j].colIndex];
						}
					}

					newData.names.push(nameRaw);
					newData.values.push(data.resultset[i][positions.metric.colIndex].f);
					nameRaw = '';
				}
				else {
					if (positions.fields) {
						newData.names.push(data.resultset[i][positions.fields[0].colIndex]);
						newData.values.push(data.resultset[i][positions.metric.colIndex].f);
						nameRaw = data.resultset[i][positions.fields[0].colIndex];

						if (data.resultset[i+1] && (nameRaw === data.resultset[i+1][positions.fields[0].colIndex])) {
							valuesRaw.push(data.resultset[i][positions.metric.colIndex].f);
						}
						else {
							valuesRaw.push(data.resultset[i][positions.metric.colIndex].f);
							newData.groupNames.push(nameRaw);
							newData.groupValues.push(valuesRaw);

							nameRaw = '';
							valuesRaw = [];
						}
					}
				}
			}
		}
		
		return newData;
	}

	/**
	 * Construct search for Nominatim URL
	 *
	 * @example
	 * street=<housenumber> <streetname>
	 * city=<city>
	 * county=<county>
	 * state=<state>
	 * country=<country>
	 * http://nominatim.openstreetmap.org/search?<params>
	 *
	 * @method constructSearch
	 * @private
	 * @param  {Object} args Properties for construct search
	 * @return {String}      Params for URL
	 */
	function constructSearch(args) {
		var field = args.lookupfields;
		var name = args.name.split(', ');
		var len = field.length;
		var searchString = '';
		var i;

		for (i = 0; i < len; i++) {
			if (field[i].name === 'street') {
				searchString += 'street=' + name[i] + '&';
			}
			else if (field[i].name === 'city') {
				searchString += 'city=' + name[i] + '&';
			}
			else if (field[i].name === 'county') {
				searchString += 'county=' + name[i] + '&';
			}
			else if (field[i].name === 'state') {
				searchString += 'state=' + name[i] + '&';
			}
			else if (field[i].name === 'country') {
				searchString += 'country=' + name[i] + '&';
			}
		}

		return searchString;
	}

	/**
	 * Map start and get Lat and Lon
	 *
	 * @method mapStart
	 * @private
	 * @param  {Object} args Properties for render map
	 */
	function mapStart(args) {
		var addressPoints = [];
		var latlngs = [];
		var bounds = [];
		var locs;
		var params;

		if (args.mapType === 'map_heat') {
			if (args.lookupfields[0].name === 'lat') {
				locs = args.name.split(', ');
				latlngs.push(Number(locs[0]));
				latlngs.push(Number(locs[1]));
				addressPoints.push(latlngs);
				latlngs = [];
				args.map.bounds.push(addressPoints);
				// if ((args.i + 1) === args.len) {
					args.map.fitBounds(args.map.bounds);
				// }
				Saiku.leaflet.heatLayer(addressPoints, { minOpacity: 20, radius: 20 }).addTo(args.map);
			}
			else {
				Saiku.ui.block('Loading map...');
				params = constructSearch(args);
				$.getJSON(Settings.MAPS_OSM_NOMINATIM + 'search?' + params + '&format=json&polygon=1&addressdetails=1',
					function (data) {
						for (var j = 0, jLen = data.length; j < jLen; j++) {
							if (data[j] && data[j].lat && data[j].lon) {
								latlngs.push(Number(data[j].lat));
								latlngs.push(Number(data[j].lon));
								addressPoints.push(latlngs);
								args.map.bounds.push(addressPoints);
							}
							latlngs = [];
						}

						// if ((args.i + 1) === args.len) {
							args.map.fitBounds(args.map.bounds);
						// }

						Saiku.leaflet.heatLayer(addressPoints, { minOpacity: 20, radius: 20 }).addTo(args.map);
					})
                    .done(function() {
                        Saiku.ui.unblock();
                    })
                    .fail(function(jqxhr, textStatus, error) {
						var err = textStatus + ', ' + error;
						console.log('Request Failed: ' + err);
                    	Saiku.ui.unblock();
                    });
			}
		}
		else if (args.mapType === 'map_marker') {
			if (args.lookupfields[0].name === 'lat') {
				locs = args.name.split(', ');
				Saiku.leaflet.marker(new Saiku.leaflet.LatLng(locs[0], locs[1])).addTo(args.map)
					.bindPopup(
					//data[j].display_name + '<br>' +
					'<b>' + args.metric + ': </b>' + ((typeof args.value === 'object') ? args.value.join(', ') : args.value)
				);
				args.map.bounds.push([locs[0], locs[1]]);
				
				// if ((args.i + 1) === args.len) {
					args.map.fitBounds(args.map.bounds);
				// }
			}
			else {
				Saiku.ui.block('Loading map...');
				params = constructSearch(args);
				$.getJSON(Settings.MAPS_OSM_NOMINATIM + 'search?' + params + '&format=json&polygon=1&addressdetails=1',
					function (data) {
						for (var j = 0, jLen = data.length; j < jLen; j++) {
							if (data[j] && data[j].lat && data[j].lon) {
								Saiku.leaflet.marker([data[j].lat, data[j].lon]).addTo(args.map)
									.bindPopup(
									data[j].display_name + '<br>' +
									'<b>' + args.metric + ': </b>' + ((typeof args.value === 'object') ? args.value.join(', ') : args.value)
								);
								args.map.bounds.push([data[j].lat, data[j].lon]);
							}
						}
						// if ((args.i + 1) === args.len) {
							args.map.fitBounds(args.map.bounds);
						// }
					})
                    .done(function() {
                        Saiku.ui.unblock();
                    })
                    .fail(function(jqxhr, textStatus, error) {
						var err = textStatus + ', ' + error;
						console.log('Request Failed: ' + err);
                    	Saiku.ui.unblock();
                    });
			}
		}
	}

	/**
	 * Resize map in canvas
	 *
	 * @method resize
	 * @public
	 */
	SaikuMapRenderer.prototype.resize = function() {
		var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

        if (fullscreenElement) {
			this._el().canvas.find('#' + this._idMap).width(this._workspaceSize().width);
			this._el().canvas.find('#' + this._idMap).height(this._workspaceSize().height);
        }
        else {
        	if (Settings.MODE === 'map') {
				this._el().canvas.find('#' + this._idMap).width(this._workspaceSize().width);
				this._el().canvas.find('#' + this._idMap).height(this._workspaceSize().height);
			}
			else {
				this._el().canvas.find('#' + this._idMap).width(this._workspaceSize().width - 10);
				this._el().canvas.find('#' + this._idMap).height(this._workspaceSize().height - 10);
			}
        }
	};

	/**
	 * Adjust map in canvas
	 *
	 * @method adjust
	 * @public
	 */
	SaikuMapRenderer.prototype.adjust = function() {
	    var self = this;
	    // var calculateLayout = function() {
   		// 	Saiku.mapLeaflet._onResize();
   		// 	Saiku.mapLeaflet.panTo(new Saiku.leaflet.LatLng(21.505, -0.09));
	    // };
	    // var lazyLayout = _.debounce(calculateLayout, 300);
	    $(window).resize(function() {
	        // self._el().canvas.fadeOut(150);
	        self.resize();
	        // lazyLayout();
	    });
	};

	/**
	 * Force the adjust map in canvas when click in tab
	 *
	 * @method adjustTrigger
	 * @public
	 */
	SaikuMapRenderer.prototype.adjustTrigger = function() {
        _.defer(function() {
        	$(window).trigger('resize');
        });
	};

	/**
	 * Render map
	 *
	 * @method renderMap
	 * @public
	 */
	SaikuMapRenderer.prototype.renderMap = function() {
		var len = this._data.names.length;
		var arrNames;
		var arrValues;
		var i;

		// Create element #map-xx in .canvas_wrapper DOM
		this._el().canvas.empty();
		this._el().canvas.append('<div class="map-render" id="' + this._idMap + '"></div>');
		this.resize();

		if (this._runWorkspaceMap) {
			// Show/hide buttons in query toolbar
			this.workspace.querytoolbar.$el.find('ul.chart > li').find('a').removeClass('on');
			this.workspace.querytoolbar.$el.find('ul.chart [href="#export_button"]').parent().attr('disabled', 'disabled');
			this.workspace.querytoolbar.$el.find('ul.chart > li#charteditor').attr('disabled', 'disabled');
			this.workspace.querytoolbar.$el.find('ul.chart [href="#map"]').addClass('on');
		}

		this._map = Saiku.leaflet.map(this._idMap).setView([21.505, -0.09], 2);
		this._map.bounds = [];

		if (this._data.mapType === 'map_heat') {
			Settings.MAPS_OPTIONS.OSM.subdomains = '1234';
		}
		else {
			delete Settings.MAPS_OPTIONS.OSM.subdomains;
		}

		// TODO: The user can add a API Google Maps or Map Box
		Saiku.leaflet.tileLayer(Settings.MAPS_TILE_LAYER.OSM[this._data.mapType], Settings.MAPS_OPTIONS.OSM).addTo(this._map);
		this._el().canvas.find('#' + this._idMap).find('.leaflet-top').css('zIndex', '100');

		if (this._data.names.length === this._data.groupNames.length) {
			arrNames = this._data.names;
			arrValues = this._data.values;
		}
		else {
			if (this._data.groupNames.length > 0) {
				arrNames = this._data.groupNames;
				arrValues = this._data.groupValues;
			}
			else {
				arrNames = this._data.names;
				arrValues = this._data.values;		
			}
		}
		
		for (i = 0; i < len; i++) {
			mapStart({
				i: i,
				len: len, 
				map: this._map, 
				mapType: this._data.mapType,
				name: arrNames[i], 
				value: arrValues[i], 
				metric: this._data.mapProperties.mapDefinition.metric,
				search: this._data.mapProperties.mapDefinition.search,
				lookupfields: this._data.mapProperties.lookupfields
			});
		}
	};

	return SaikuMapRenderer;
}());
