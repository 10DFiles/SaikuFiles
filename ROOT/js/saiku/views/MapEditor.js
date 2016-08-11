/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2015
 */

/**
 * @dependencies
 * - leaflet/leaflet-heat.js
 * - plugins/CCC_Chart/map_editor.css
 * - plugins/CCC_Chart/plugin.js
 * - render/SaikuMapRenderer.js
 * - views/QueryToolbar.js
 * - views/Workspace.js
 * - Saiku.js
 * - Settings.js
 */

/**
 * Class for edit map
 * 
 * @class MapEditor
 */
var MapEditor = Modal.extend({
    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
    type: 'map-editor',

    /**
     * Property with main template of modal
     *
     * @property message
     * @type {String}
     * @private
     */
    message: '<form class="form-group">' +
                '<label for="map-type" class="i18n">Map Type:</label>' +
                '<select id="map-type">' +
                    // '<option value="map_geo">Geo Map</option>' +
                    // '<option value="map_heat">Heat Map</option>' +
                    // '<option value="map_marker" selected>Marker Map</option>' +
                '</select>' +
                '<div class="div-country" hidden>' +
                    '<label for="select-country" class="i18n">Select Country Field:</label>' +
                    '<select id="select-country"></select>' +
                '</div>' +
                '<div class="div-geo">' +
                    '<label for="geo-lookup" class="i18n">Geo Lookup: <input type="checkbox" id="geo-lookup" value="true" checked></label>' +
                    '<div class="div-latlon" hidden>' +
                        '<label for="lat" class="i18n">Latitude Field:</label>' +
                        '<select id="lat"><option value=""></option></select>' +
                        '<label for="lon" class="i18n">Longitude Field:</label>' +
                        '<select id="lon"><option value=""></option></select>' +
                    '</div>' +
                    // '<div class="div-lookup">' +
                    //     '<label for="lookups">Lookup Fields:</label>' +
                    //     '<select id="lookups" multiple></select>' +
                    //     '<label for="geo-bias">Geo Bias (<a href="http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry" id="region-codes" target="_blank">Region Codes</a>):' +
                    //     '<input type="text" id="geo-bias">' +
                    // '</div>' +
                '</div>' +
                '<div class="div-metric">' +
                    '<label for="select-metric" class="i18n">Select a Metric:</label>' +
                    '<select id="select-metric"></select>' +
                '</div>' +
                '<div class="div-lookup">' +
                    '<div class="div-search chosen-mb" hidden>' +
                        '<label for="street-lookups" class="i18n">Street Mapping:</label>' +
                        '<select id="street-lookups"><option value=""></option></select>' +
                        '<label for="city-lookups" class="i18n">City Mapping:</label>' +
                        '<select id="city-lookups"><option value=""></option></select>' +
                        '<label for="county-lookups" class="i18n">County Mapping:</label>' +
                        '<select id="county-lookups"><option value=""></option></select>' +
                        '<label for="state-lookups" class="i18n">State Mapping:</label>' +
                        '<select id="state-lookups"><option value=""></option></select>' +
                        '<label for="country-lookups" class="i18n">Country Mapping:</label>' +
                        '<select id="country-lookups"><option value=""></option></select>' +
                    '</div>' +
                '</div>' +
             '</form>',

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Save', method: 'save' },
        { text: 'Cancel', method: 'close' },
        { text: 'Help', method: 'help' }
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click  .dialog_footer a' : 'call',
        'change #map-type'        : 'change_map',
        'click  #geo-lookup'      : 'change_geo',
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.options.title = 'Map Settings';

        if (args && args.data && _.has(args, 'data')) {
            var mapProperties = this.workspace.query.getProperty('saiku.ui.map.options');
            var mapType = mapProperties ? mapProperties.mapDefinition.type : '';
            this.renderer = args.data;
        }
        else {
            this.$el = args;
        }
        
        // console.log(this.workspace);
        // console.log(this.workspace.query);
        // console.log(this.workspace.query.getProperty('saiku.ui.map.options'));
        // console.log(this.workspace.query.getProperty('saiku.ui.render.mode'));
        // console.log(this.workspace.query.getProperty('saiku.ui.render.type'));
        
        // Maintain `this` in callbacks
        _.bindAll(this, 'template_editor', 'post_render', 'show_map_type', 'get_rows', 'get_map_properties');

        this.bind('open', function() {
            this.post_render();
            this.show_map_type();
            this.get_rows(this.workspace.query);
            this.get_map_properties(mapProperties, mapType);
            this.$el.find('select').chosen({ allow_single_deselect: true });
        });
    },

    /**
     * Main template of modal
     *
     * @public
     * @method template_editor
     * @return {String} HTML template
     */
    template_editor: function() {
        return this.message;
    },

    /**
     * Redirect for link in wiki
     *
     * @method help
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    help: function(event) {
        event.preventDefault();
        window.open('http://wiki.meteorite.bi/display/SAIK/Maps');
    },

    /**
     * Centralize dialog in screen
     *
     * @method post_render
     * @public
     */
    post_render: function() {
        var tPerc = (((($('body').height() - 500) / 2) * 100) / $('body').height());
        var lPerc = (((($('body').width() - 500) / 2) * 100) / $('body').width());

        this.$el.dialog('option', 'position', 'center');
        this.$el.parents('.ui-dialog').css({ 
            width: '500px', 
            top: tPerc + '%', 
            left: lPerc + '%' 
        });
    },

    /**
     * Show the map type (Geo Map, Heat Map or Marker Map)
     *
     * @method show_map_type
     * @private
     */
    show_map_type: function() {
        if (Settings.MAPS_TYPE === 'OSM') {
            this.$el.find('#map-type').append(
                '<option value="map_heat">Heat Map</option>' +
                '<option value="map_marker" selected>Marker Map</option>'
            );
            this.$el.find('.div-search').show();
        }
        // else if (Settings.MAPS_TYPE === 'GMAPS') {
        //     this.$el.find('#map-type').append(
        //         '<option value="map_geo">Geo Map</option>' +
        //         '<option value="map_heat">Heat Map</option>' +
        //         '<option value="map_marker" selected>Marker Map</option>'
        //     );
        //     this.$el.find('.div-search').hide();
        // }
    },

    /**
     * Template for create element <option>
     *
     * @method option_template
     * @private
     * @param  {Object} parameters Name parameter
     * @return {String}            HTML template
     */
    option_template: function(data) {
        return _.template(
            '<% _.each(obj.data, function(name) { %>' +
                '<option value="<%= name %>"><%= name %></option>' +
            '<% }); %>'
        )({ data: data });
    },

    /**
     * Get rows and append data in element <option>
     *
     * @method get_rows
     * @public
     * @param  {Object} query data
     */
    get_rows: function(query) {
        var rows = query.model ? query.model.queryModel.axes.ROWS.hierarchies : query.queryModel.axes.ROWS.hierarchies;
        var measures = query.model ? query.model.queryModel.details.measures : query.queryModel.details.measures;
        var arrRows = [];
        var arrMeasures = [];
        var $rowsTemplate;
        var $measuresTemplate;

        _.each(rows, function(row) {
            _.each(row.levels, function(level) {
                arrRows.push(level.name);
            });
        });

        _.each(measures, function(measure) {
            arrMeasures.push(measure.name);
        });

        $rowsTemplate = this.option_template(arrRows);
        $measuresTemplate = this.option_template(arrMeasures);

        this.$el.find('#select-country').append($rowsTemplate);
        this.$el.find('#lookups').append($rowsTemplate);
        this.$el.find('#street-lookups').append($rowsTemplate);
        this.$el.find('#city-lookups').append($rowsTemplate);
        this.$el.find('#county-lookups').append($rowsTemplate);
        this.$el.find('#state-lookups').append($rowsTemplate);
        this.$el.find('#country-lookups').append($rowsTemplate);
        this.$el.find('#lat').append($rowsTemplate);
        this.$el.find('#lon').append($rowsTemplate);
        this.$el.find('#select-metric').append($measuresTemplate);
    },

    /**
     * Switch map type
     *
     * @method switch_map_type
     * @private
     * @param  {String} data Map type
     */
    switch_map_type: function(data) {
        switch (data) {
        case 'map_geo':
            this.$el.find('.div-geo').hide();
            this.$el.find('.div-country').show();
            this.$el.find('.div-metric').show();
            this.$el.find('.div-latlon').removeClass('chosen-mb');
            break;
        case 'map_heat':
            this.$el.find('.div-geo').show();
            this.$el.find('.div-country').hide();
            this.$el.find('.div-metric').hide();
            this.$el.find('.div-latlon').addClass('chosen-mb');
            break;
        case 'map_marker':
            this.$el.find('.div-geo').show();
            this.$el.find('.div-country').hide();
            this.$el.find('.div-metric').show();
            this.$el.find('.div-latlon').removeClass('chosen-mb');
            break;
        }
    },

    /**
     * Get map properties
     *
     * @method get_map_properties
     * @public
     */
    get_map_properties: function(mapProperties, mapType) {
        this.switch_map_type(mapType);

        if (mapType === 'map_marker' || mapType === 'map_heat') {
            var search = mapProperties.mapDefinition.search;

            this.$el.find('#map-type').val(mapType);
            this.$el.find('#map-type').trigger('chosen:updated');

            if ((mapProperties.mapDefinition.latfield === null || mapProperties.mapDefinition.latfield === undefined) &&
                (mapProperties.mapDefinition.lonfield === null || mapProperties.mapDefinition.lonfield === undefined)) {
                this.$el.find('#geo-lookup').prop('checked', true);
                this.$el.find('#lookups').val(mapProperties.mapDefinition.lookupfields);
                this.$el.find('#lookups').trigger('chosen:updated');
                this.$el.find('#geo-bias').val(mapProperties.mapDefinition.bias);
                
                if (search.street !== undefined && search.street !== '') {
                    this.$el.find('#street-lookups').val(search.street);
                }
                if (search.city !== undefined && search.city !== '') {
                    this.$el.find('#city-lookups').val(search.city);
                }
                if (search.county !== undefined && search.county !== '') {
                    this.$el.find('#county-lookups').val(search.county);
                }
                if (search.state !== undefined && search.state !== '') {
                    this.$el.find('#state-lookups').val(search.state);
                }
                if (search.country !== undefined && search.country !== '') {
                    this.$el.find('#country-lookups').val(search.country);
                }
            }
            else {
                this.$el.find('#geo-lookup').prop('checked', false);
                this.$el.find('#lat').val(mapProperties.mapDefinition.latfield);
                this.$el.find('#lon').val(mapProperties.mapDefinition.lonfield);
                this.$el.find('#lat').trigger('chosen:updated');
                this.$el.find('#lon').trigger('chosen:updated');
            }
        }
        else if (mapType === 'map_geo') {
            this.$el.find('#map-type').val(mapType);
            this.$el.find('#map-type').trigger('chosen:updated');
            this.$el.find('#select-country').val(mapProperties.mapDefinition.lookupfields);
            this.$el.find('#select-country').trigger('chosen:updated');
        }

        if (mapType === 'map_marker' || mapType === 'map_geo') {
            this.$el.find('#select-metric').val(mapProperties.mapDefinition.metric);
            this.$el.find('#select-metric').trigger('chosen:updated');
        }

        if (mapProperties && mapProperties.mapDefinition && 
            mapProperties.mapDefinition.search !== null && mapProperties.mapDefinition.search !== undefined) {
            //this.$el.find('#select-search').val(mapProperties.mapDefinition.search);
            this.$el.find('#street-lookups').val(search.street);
            this.$el.find('#city-lookups').val(search.city);
            this.$el.find('#county-lookups').val(search.county);
            this.$el.find('#state-lookups').val(search.state);
            this.$el.find('#country-lookups').val(search.country);
            this.$el.find('#street-lookups').trigger('chosen:updated');
            this.$el.find('#city-lookups').trigger('chosen:updated');
            this.$el.find('#county-lookups').trigger('chosen:updated');
            this.$el.find('#state-lookups').trigger('chosen:updated');
            this.$el.find('#country-lookups').trigger('chosen:updated');
        }

        this.change_geo();
    },

    /**
     * Change Map Type
     *
     * @method change_map
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    change_map: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        var value = $currentTarget.val();
        this.switch_map_type(value);
    },

    /**
     * Change Geo Lookup
     *
     * @method change_geo
     * @private
     */
    change_geo: function() {
        if (this.$el.find('#geo-lookup').is(':checked')) {
            this.$el.find('.div-lookup').show();
            this.$el.find('.div-latlon').hide();
            this.$el.find('.div-metric').removeClass('chosen-mb');
        } 
        else {
            this.$el.find('.div-lookup').hide();
            this.$el.find('.div-latlon').show();
            this.$el.find('.div-metric').addClass('chosen-mb');
        }
    },

    /**
     * Save map options
     *
     * @method save
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    save: function(event) {
        event.preventDefault();
        var mapType = this.$el.find('#map-type').val();
        var mapProperties = {};
        var saikuMapRenderer;
        var search;
        
        mapProperties.mapDefinition = {};
        mapProperties.mapDefinition.type = mapType;

        if (mapType === 'map_geo') {
            mapProperties.mapDefinition.lookupfields = this.$el.find('#select-country').val();
        }
        else {
            if (this.$el.find('#geo-lookup').is(':checked')) {
                mapProperties.mapDefinition.lookupfields = this.$el.find('#lookups').val();
                mapProperties.mapDefinition.latfield = null;
                mapProperties.mapDefinition.lonfield = null;
                mapProperties.mapDefinition.bias = this.$el.find('#geo-bias').val();
            }
            else {
                mapProperties.mapDefinition.latfield = this.$el.find('#lat').val();
                mapProperties.mapDefinition.lonfield = this.$el.find('#lon').val();
                mapProperties.mapDefinition.lookupfields = null;
            }
        }

        // mapProperties.mapDefinition.maptype = mapType;
        mapProperties.mapDefinition.geolookup = this.$el.find('#geo-lookup').is(':checked');
        mapProperties.mapDefinition.metric = this.$el.find('#select-metric').val();
        mapProperties.mapDefinition.search = {};
        mapProperties.mapDefinition.search.street = this.$el.find('#street-lookups').val();
        mapProperties.mapDefinition.search.city = this.$el.find('#city-lookups').val();
        mapProperties.mapDefinition.search.county = this.$el.find('#county-lookups').val();
        mapProperties.mapDefinition.search.state = this.$el.find('#state-lookups').val();
        mapProperties.mapDefinition.search.country = this.$el.find('#country-lookups').val();
        mapProperties.hasProcessed = false;
        search = mapProperties.mapDefinition.search;

        if ((search.street !== '' || search.city !== '' || search.county !== '' || search.state !== '' || search.country !== '') || 
            (mapProperties.mapDefinition.latfield !== null || mapProperties.mapDefinition.lonfield !== null)) {

            if (Settings.MAPS_TYPE === 'OSM') {
                saikuMapRenderer = new SaikuMapRenderer(this, mapType, mapProperties, 'run_workspace_map');
                saikuMapRenderer.renderMap();
            }
            // else if (Settings.MAPS_TYPE === 'GMAPS') {
            //     this.renderer.switch_chart(mapType, mapProperties);
            // }
            
            // TODO: Add icon loading of Saiku when OSM this processing "lat" and "lon"
            if (mapProperties.mapDefinition.latfield === null && mapProperties.mapDefinition.lonfield === null) {
                Saiku.ui.block('Loading map...');
            }

            // Set properties
            this.workspace.query.setProperty('saiku.ui.map.options', mapProperties);
            this.workspace.query.setProperty('saiku.ui.render.mode', 'map');
            this.workspace.query.setProperty('saiku.ui.render.type', mapType);
        }

        this.$el.dialog('close');
    }
});
