/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

var Dashboards = Backbone.View.extend({
    el: $('body'),

    events: {
        'click  .show-sidebar-filter'  : 'show_sidebar_filter',
        'click  .close-sidebar-filter' : 'toggle_sidebar_filter',
        'click  .dashboards'           : 'hide_sidebar_filter',
        'click  .form-group'           : 'accordion',
        'click  .radio-filter'         : 'radio_filter',
        'click  .apply-filter'         : 'input_filter',
        'change .select-filter'        : 'dropdown_filter'
    },

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.panels;
        this.filters;

        if (this.biserver) {
            this.serverpath = '/pentaho';
            this.clientpath = '/plugin/saiku/api/embed';
            this.openpath = '/pentaho/plugin/saiku/api/pentaho/repository/resource?file=';
            this.discoverpath = '/pentaho/plugin/saiku/api/admin/discover/';
        }
        else {
            this.serverpath = '/saiku';
            this.clientpath = '/rest/saiku/embed';
            this.openpath = '/saiku/rest/saiku/api/repository/resource?file=';
            this.discoverpath = '/saiku/rest/saiku/admin/discover/';
        }

        this.saikuClient = new SaikuClient({
            server: this.serverpath,
            path: this.clientpath,
            user: null,
            password: null,
            dashboards: true,
            blockUI: true
        });

        this.open_file(this.filePath);
    },

    render: function(data) {
        this.panels = data.panels;
        this.filters = data.filters;
        this.generate_grids(this.panels);
        this.add_reports(this.panels);
        this.$el.find('.dashboard-title > h1').text(data.title);
        if (this.filters && !(_.isEmpty(this.filters))) {
            this.$el.find('.show-sidebar-filter').show();
            this.add_filters(this.filters);
        }
    },

    open_file: function(filePath) {
        var self = this;
        var host = window.location.origin;

        $.ajax({
            url: host + this.openpath + filePath,
            type: 'GET',
            contentType: 'application/json',
            success: function(data) {
                self.render(JSON.parse(data));
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('Error: ' + textStatus);
                console.error(jqXHR);
                console.error(textStatus);
                console.error(errorThrown);
            }
        });
    },

    accordion: function(event) {
        var $target = $(event.target);

        if ($target.prop('tagName') === 'H3') {
            $target.parent().find('.accordion-content').slideToggle('fast', function() {
                if ($(this).hasClass('accordion-on')) {
                    $(this).removeClass('accordion-on');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').removeClass('toggle-accordion-collapsed');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').addClass('toggle-accordion-expand');
                }
                else {
                    $(this).addClass('accordion-on');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').removeClass('toggle-accordion-expand');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').addClass('toggle-accordion-collapsed');
                }
            });
        }
        else if ($target.prop('tagName') === 'FORM') {
            $target.find('.accordion-content').slideToggle('fast', function() {
                if ($(this).hasClass('accordion-on')) {
                    $(this).removeClass('accordion-on');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').removeClass('toggle-accordion-collapsed');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').addClass('toggle-accordion-expand');
                }
                else {
                    $(this).addClass('accordion-on');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').removeClass('toggle-accordion-expand');
                    $(this).closest('.accordion-toggle').find('.toggle-accordion').addClass('toggle-accordion-collapsed');
                }
            });   
        }
    },

    add_reports: function(data) {
        var iLen = _.size(data);
        var i, j;

        for (i = 0; i < iLen; i++) {
            if (data[i]) {
                if (data[i].render === 'table') {
                    this.saikuClient.execute({
                        file: data[i].file,
                        htmlObject: data[i].htmlObject,
                        render: data[i].render
                    });
                }
                else if (data[i].render === 'chart') {
                    this.saikuClient.execute({
                        file: data[i].file,
                        htmlObject: data[i].htmlObject,
                        render: data[i].render,
                        mode: data[i].mode,
                        chartDefinition: data[i].chartDefinition ? JSON.parse(data[i].chartDefinition.replace(/'/g, '\"')) : {},
                        zoom: true
                    });
                }
                else if (data[i].render === 'map') {
                    this.saikuClient.execute({
                        file: data[i].file,
                        htmlObject: data[i].htmlObject,
                        render: data[i].render,
                        mode: data[i].mode,
                        mapDefinition: data[i].mapDefinition ? JSON.parse(data[i].mapDefinition.replace(/'/g, '\"')) : {}
                    });
                }
            }
            else {
                if (data['embedCode'].length && data['embedCode'].length > 0) {
                    for (j = 0, jLen = data['embedCode'].length; j < jLen; j++) {
                        // When add a custom table styles, is changing rendering of table for playground, then 
                        // the plugin Saiku Client (SaikuEmbed.js) does not render the table to apply the style.
                        if (data['embedCode'][j].oldRender && data['embedCode'][j].oldRender === 'table') {
                            this.saikuClient.execute({
                                file: data['embedCode'][j].file,
                                htmlObject: data['embedCode'][j].id,
                                render: 'table'
                            });
                        }

                        this.saikuClient.execute({
                            file: data['embedCode'][j].file,
                            htmlObject: data['embedCode'][j].id,
                            render: 'playground',
                            uris: data['embedCode'][j].uris,
                            codeJS: data['embedCode'][j].codeJS
                        });
                    }
                }
            }
        }
    },

    add_filters: function(data) {
        var len = data.length;
        var i;

        for (i = 0; i < len; i++) {
            this.generate_forms_filters(data[i]);
            
            if (data[i].contentType === 'createList') {
                if (data[i].type === 'radioButton') {
                    this.generate_radio_filters(data[i]);
                }
                else if (data[i].type === 'dropdown') {
                    this.generate_dropdown_filters(data[i], 'default');
                }
                else if (data[i].type === 'dropdownMultiselect') {
                    this.generate_dropdown_filters(data[i], 'multiple');
                }
            }
            else if (data[i].contentType === 'lookup') {
                this.open_lookup(data[i]);
            }
            // TODO: Update code
            else if (data[i].type === 'textBox') {
                this.generate_input_filters(data[i]);
            }
        }
    },

    open_lookup: function(data) {
        var self = this;
        var host = window.location.origin;

        $.ajax({
            url: host + this.discoverpath + data.contentLookup,
            type: 'GET',
            contentType: 'application/json',
            success: function(obj) {
                var contentList = [];
                var len = obj.length;
                var i;

                for (i = 0; i < len; i++) {
                    if ($.inArray(obj[i].name, contentList) === -1) {
                        contentList.push(obj[i].name);
                    }
                }

                data.contentList = contentList;

                if (data.type === 'radioButton') {
                    self.generate_radio_filters(data);
                }
                else if (data.type === 'textBox') {
                    self.generate_input_filters(data);
                }
                else if (data.type === 'dropdown') {
                    self.generate_dropdown_filters(data, 'default');
                }
                else if (data.type === 'dropdownMultiselect') {
                    self.generate_dropdown_filters(data, 'multiple');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('Error: ' + textStatus);
                console.error(jqXHR);
                console.error(textStatus);
                console.error(errorThrown);
            }
        });
    },

    show_sidebar_filter: function(event) {
        event.preventDefault();
        this.$el.find('.sidebar-filter').addClass('on');
        this.$el.find('.sidebar-filter').toggle('slide');
    },

    toggle_sidebar_filter: function(event) {
        if (event) { event.preventDefault(); }
        if (this.$el.find('.sidebar-filter').hasClass('on')) {
            this.$el.find('.sidebar-filter').removeClass('on');
            this.$el.find('.sidebar-filter').toggle('slide');
        }
    },

    hide_sidebar_filter: function(event) {
        var $target = $(event.target);
        if ($target.attr('class') !== 'sidebar-filter on') {
            this.toggle_sidebar_filter(event);
        }
    },

    widget_dimensions: function() {
        var maxCols = 6;
        var widgetMargin = 15;
        var maxWidth = this.$el.find('.gridster ul').width() - 280;
        return {
            width: Math.floor((maxWidth / maxCols) - (widgetMargin * 2)),
            height: 100
        }
    },

    create_gridster: function() {
        var gridster = this.$el.find('.gridster ul').gridster({
            autogrow_cols: true,
            widget_margins: [15, 15],
            widget_base_dimensions: [this.widget_dimensions().width, this.widget_dimensions().height],
            draggable: {
                enabled: false
            }
        }).data('gridster');

        gridster.disable();
    },

    generate_grids: function(data) {
        var len = _.size(data);
        var i;

        for (i = 0; i < len; i++) {
            if (data[i]) {
                this.$el.find('.gridster ul').append(
                    '<li data-row="' + data[i].row + '" data-col="' + data[i].col + '" data-sizex="' + data[i].size_x + '" data-sizey="' + data[i].size_y + '">' +
                        '<div class="panel-title">' +
                            '<h3>' + data[i].title + '</h3>' +
                            // '<a href="#open_help" class="context-menu-options"></a>' +
                        '</div>' +
                        '<div class="panel-body workspace_results" id="' + data[i].htmlObject.replace('#', '') + '"></div>' +
                    '</li>'
                );
            }
        }

        this.create_gridster();
    },

    generate_forms_filters: function(data) {
        var htmlObject = data.id.replace(/\W/gi, '');

        if (data && data.contentType) {
            this.$el.find('.sidebar-filter').append(
                '<form class="form-group '+ htmlObject +' accordion-toggle" data-htmlobject="' + data.id + '" data-parameter="' + data.parameter + '">' +
                    '<a class="toggle-accordion toggle-accordion-collapsed" href="#accordion"></a><h3>' + data.name + '</h3>' +
                    '<div class="accordion-content accordion-on"></div>' +
                '</form>'
            );
        }
    },

    generate_radio_filters: function(data) {
        var htmlObject = data.id.replace(/\W/gi, '');
        var len = data.contentList.length;
        var i;

        this.$el.find('.form-group.' + htmlObject + ' > .accordion-content').append(
            '<label><input type="radio" class="radio-filter" name="' + htmlObject + '" value=""> Empty Filter</label>'
        );

        for (i = 0; i < len; i++) {
            this.$el.find('.form-group.' + htmlObject + ' > .accordion-content').append(
                '<label><input type="radio" class="radio-filter" name="' + htmlObject + '" value="[' + data.contentList[i] + ']"> ' + data.contentList[i] + '</label>'
            );
        }
    },

    generate_input_filters: function(data) {
        var htmlObject = data.id.replace(/\W/gi, '');

        this.$el.find('.form-group.' + htmlObject + ' > .accordion-content').append(
            '<label for="input-filter">Parameter: <b>' + data.parameter + '</b></label>' +
            '<input type="text" class="input-filter" name="' + htmlObject + '">' +
            '<a class="form_button apply-filter">Apply Filter</a>'
        );
    },

    generate_dropdown_filters: function(data, type) {
        var htmlObject = data.id.replace(/\W/gi, '');
        var len = data.contentList.length;
        var contentList = [];
        var $option;
        var i;

        if (type === 'default') {
            this.$el.find('.form-group.' + htmlObject + ' > .accordion-content').append(
                '<select class="select-filter" name="' + htmlObject + '"></select>'
            );
        }
        else {
            this.$el.find('.form-group.' + htmlObject + ' > .accordion-content').append(
                '<select class="select-filter" name="' + htmlObject + '" multiple></select>'
            );   
        }

        for (i = 0; i < len; i++) {
            contentList.push(data.contentList[i]);
        }

        if (type === 'default') {
            $option = this.option_template(contentList, false);
        }
        else {
            $option = this.option_template(contentList, true);
        }

        this.$el.find('.form-group.' + htmlObject + ' > .accordion-content > select').append($option);
    },

    option_template: function(data, isMultiple) {
        return _.template(
            '<% if (!obj.isMultiple) { %>' +
                '<option value="">-- Select --</option>' +
            '<% } else {%>' +
                '<option value="">-- Empty Filter --</option>' +
            '<% } %>' +
            '<% _.each(obj.data, function(value) { %>' +
                '<option value="[<%= value %>]"><%= value %></option>' +
            '<% }); %>'
        )({ data: data, isMultiple: isMultiple});
    },

    set_parameter_link: function(htmlObject, params) {
        var dataParamsLink;

        if ($(htmlObject).data('parameterlink') === undefined) {
            $(htmlObject).data('parameterlink', JSON.stringify(params));
            return JSON.parse($(htmlObject).data('parameterlink'));
        }
        else {
            dataParamsLink = JSON.parse($(htmlObject).data('parameterlink'));
            dataParamsLink = _.extend(dataParamsLink, params);
            $(htmlObject).data('parameterlink', JSON.stringify(dataParamsLink));
            return dataParamsLink;
        }
    },

    client_options: function(render, data, params) {
        var opts = {};

        if (render === 'table') {
            opts.file = data.file;
            opts.htmlObject = data.htmlObject;
            opts.render = data.render;
            opts.params = params;
        }
        else if (render === 'chart') {
            opts.file = data.file;
            opts.htmlObject = data.htmlObject;
            opts.render = data.render;
            opts.mode = data.mode;
            opts.chartDefinition = data.chartDefinition ? JSON.parse(data.chartDefinition.replace(/'/g, '\"')) : {};
            opts.zoom = true;
            opts.params = params;
        }
        else if (render === 'map') {
            opts.file = data.file;
            opts.htmlObject = data.htmlObject;
            opts.render = data.render;
            opts.mode = data.mode;
            opts.mapDefinition = data.mapDefinition ? JSON.parse(data.mapDefinition.replace(/'/g, '\"')) : {};
            opts.params = params;
        }
        else {
            opts.file = data.file;
            opts.htmlObject = data.id;
            opts.render = 'playground';
            opts.uris = data.uris;
            opts.codeJS = data.codeJS;
            opts.params = params;
        }

        return opts;
    },

    run_link_filters: function(filters, value) {
        var iLen = filters.length;
        var jLen;
        var i, j;

        for (i = 0; i < iLen; i++) {
            jLen = _.size(filters[i].linkFilters[0]);
            for (j = 0; j < jLen; j++) {
                var params = {};

                params[filters[i].linkFilters[0][j].parameter] = value;

                if (filters[i].linkFilters[0][j].render === 'table') {
                    params = this.set_parameter_link(filters[i].linkFilters[0][j].htmlObject, params);                    
                    this.saikuClient.execute(this.client_options('table', filters[i].linkFilters[0][j], params));
                }
                else if (filters[i].linkFilters[0][j].render === 'chart') {
                    params = this.set_parameter_link(filters[i].linkFilters[0][j].htmlObject, params);
                    this.saikuClient.execute(this.client_options('chart', filters[i].linkFilters[0][j], params));
                }
                else if (filters[i].linkFilters[0][j].render === 'map') {
                    params = this.set_parameter_link(filters[i].linkFilters[0][j].htmlObject, params);
                    this.saikuClient.execute(this.client_options('map', filters[i].linkFilters[0][j], params));
                }
            }
        }
    },

    radio_filter: function(event) {
        var $currentTarget = $(event.currentTarget);
        var value = $currentTarget.val();
        var htmlObject = $currentTarget.closest('.form-group').data('htmlobject').split('_-_')[0];
        var parameter = $currentTarget.closest('.form-group').data('parameter');
        var lenPanels = _.size(this.panels);
        var lenFilters = this.filters.length;
        var filters = [];
        var params = {};
        var i, j;

        params[parameter] = value;

        for (i = 0; i < lenPanels; i++) {
            if (this.panels[i] && this.panels[i].id === htmlObject) {
                if (this.panels[i].render === 'table') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('table', this.panels[i], params));
                }
                else if (this.panels[i].render === 'chart') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('chart', this.panels[i], params));
                }
                else if (this.panels[i].render === 'map') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('map', this.panels[i], params));
                }

                for (j = 0; j < lenFilters; j++) {
                    if ((this.filters[j].id === htmlObject + '_-_' + parameter) && this.filters[j].linkFilters.length > 0) {
                        filters.push(this.filters[j]);
                    }
                }
                
                this.run_link_filters(filters, value);
            }
            else {
                if (this.panels['embedCode'].length && this.panels['embedCode'].length > 0) {
                    for (j = 0, jLen = this.panels['embedCode'].length; j < jLen; j++) {
                        params = this.set_parameter_link(this.panels['embedCode'][j].id, params);
                        this.saikuClient.execute(this.client_options('embedCode', this.panels['embedCode'][j], params));
                    }
                }
            }
        }
    },

    input_filter: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);
        var value = $currentTarget.closest('.form-group').find('.input-filter').val();
        var htmlObject = $currentTarget.closest('.form-group').data('htmlobject').split('_-_')[0];
        var parameter = $currentTarget.closest('.form-group').data('parameter');
        var lenPanels = _.size(this.panels);
        var lenFilters = this.filters.length;
        var filters = [];
        var params = {};
        var i, j;

        params[parameter] = value;

        for (i = 0; i < lenPanels; i++) {
            if (this.panels[i] && this.panels[i].id === htmlObject) {
                if (this.panels[i].render === 'table') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('table', this.panels[i], params));
                }
                else if (this.panels[i].render === 'chart') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('chart', this.panels[i], params));
                }
                else if (this.panels[i].render === 'map') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('map', this.panels[i], params));
                }

                for (j = 0; j < lenFilters; j++) {
                    if ((this.filters[j].id === htmlObject + '_-_' + parameter) && this.filters[j].linkFilters.length > 0) {
                        filters.push(this.filters[j]);
                    }
                }
                
                this.run_link_filters(filters, value);
            }
            else {
                if (this.panels['embedCode'].length && this.panels['embedCode'].length > 0) {
                    for (j = 0, jLen = this.panels['embedCode'].length; j < jLen; j++) {
                        params = this.set_parameter_link(this.panels['embedCode'][j].id, params);
                        this.saikuClient.execute(this.client_options('embedCode', this.panels['embedCode'][j], params));
                    }
                }
            }
        }
    },

    dropdown_filter: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);
        var value = $currentTarget.closest('.form-group').find('.select-filter').val();
        var htmlObject = $currentTarget.closest('.form-group').data('htmlobject').split('_-_')[0];
        var parameter = $currentTarget.closest('.form-group').data('parameter');
        var lenPanels = _.size(this.panels);
        var lenFilters = this.filters.length;
        var filters = [];
        var params = {};
        var i, j;

        value = value.toString();
        params[parameter] = value;

        for (i = 0; i < lenPanels; i++) {
            if (this.panels[i] && this.panels[i].id === htmlObject) {
                if (this.panels[i].render === 'table') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('table', this.panels[i], params));
                }
                else if (this.panels[i].render === 'chart') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('chart', this.panels[i], params));
                }
                else if (this.panels[i].render === 'map') {
                    params = this.set_parameter_link(this.panels[i].htmlObject, params);
                    this.saikuClient.execute(this.client_options('map', this.panels[i], params));
                }

                for (j = 0; j < lenFilters; j++) {
                    if ((this.filters[j].id === htmlObject + '_-_' + parameter) && this.filters[j].linkFilters.length > 0) {
                        filters.push(this.filters[j]);
                    }
                }
                
                this.run_link_filters(filters, value);
            }
            else {
                if (this.panels['embedCode'].length && this.panels['embedCode'].length > 0) {
                    for (j = 0, jLen = this.panels['embedCode'].length; j < jLen; j++) {
                        params = this.set_parameter_link(this.panels['embedCode'][j].id, params);
                        this.saikuClient.execute(this.client_options('embedCode', this.panels['embedCode'][j], params));
                    }
                }
            }
        }
    }
});
