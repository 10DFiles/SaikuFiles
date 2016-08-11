/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "cubes dimensions" dialog
 */
var CubesDimensionsModal = Modal.extend({
    type: 'add-cubes-dim',

    options: {
        autoOpen: false,
        closeOnEscape: false,
        modal: true,
        title: 'Add Cubes and Dimensions',
        resizable: false,
        draggable: false
    },

    buttons: [
        { text: 'Save', method: 'save_cube_dim' },
        { text: 'Cancel', method: 'cancel_cube_dim' },
        { text: 'Help', method: 'help_cube' }
    ],

    events: {
        'click  .dialog_footer a'            : 'call',
        'click  .context-menu-options'       : 'context_menu_options',
        'click  .table-toggle'               : 'show_table_columns',
        'click  .button-tabs'                : 'button_easytabs',

        'click  .show-dim-edit'              : 'show_dim_form',
        'click  .show-dim-del'               : 'show_dim_form',
        'click  .show-dim-no'                : 'show_dim_form',
        'click  .show-dim-attr-no'           : 'show_dim_form',
        'click  .dim-attr-add'               : 'form_dimension_attr',
        'click  .dim-add'                    : 'form_dimension',
        'click  .dim-edit'                   : 'form_dimension',
        'click  .dim-del'                    : 'form_dimension',
        'keyup  #dim-name'                   : 'remove_validation',
        'change #dim-select-key'             : 'remove_validation',

        'click  .show-attr-add'              : 'show_attribute_form',
        'click  .show-attr-edit'             : 'show_attribute_form',
        'click  .show-attr-del'              : 'show_attribute_form',
        'click  .show-attr-no'               : 'show_attribute_form',
        'click  .attr-add'                   : 'form_attribute',
        'click  .attr-del'                   : 'form_attribute',
        'click  .attr-key-column'            : 'trigger_attribute_name',
        'click  .attr-cancel'                : 'cancel_attribute',
        'keyup  #attr-name'                  : 'remove_validation',
        'change #attr-key-column'            : 'remove_validation',
        'change #attr-level-type'            : 'remove_validation',

        'click  .show-hier-add'              : 'show_hierarchy_form',
        'click  .show-hier-edit'             : 'show_hierarchy_form',
        'click  .show-hier-del'              : 'show_hierarchy_form',
        'click  .show-hier-no'               : 'show_hierarchy_form',
        'click  .hier-add'                   : 'form_hierarchy',
        'click  .hier-del'                   : 'form_hierarchy',
        'click  .hier-cancel'                : 'cancel_hierarchy',
        'keyup  #hier-name'                  : 'remove_validation',
        'keyup  #hier-all-member-name'       : 'remove_validation',

        'click .search-choice'               : 'show_annotation_time_form',
        'click .show-annotation-time-del'    : 'show_annotation_time_form',
        'click .show-annotation-time-no'     : 'back_annotation_time_del',
        'blur  .chosen-choices'              : 'add_event_chosen',
        'click .annotation-time-add'         : 'form_annotation_time',
        'click .annotation-time-del'         : 'form_annotation_time',
        'click .annotation-time-back'        : 'back_annotation_time',
        'click .show-annotation-time-no'     : 'back_annotation_time',
        'keyup #annotation-time-raw'         : 'remove_validation',

        'click  .show-cube-edit'             : 'show_cube_form',
        'click  .show-cube-del'              : 'show_cube_form',
        'click  .show-cube-no'               : 'show_cube_form',
        'click  .cube-add'                   : 'form_cube',
        'click  .cube-del'                   : 'form_cube',
        'click  .cube-cancel'                : 'cancel_cube',
        'keyup  #cube-name'                  : 'remove_validation',

        'click  .show-measure-group'         : 'show_measure_group_form',
        'click  .show-measure-group-edit'    : 'show_measure_group_form',
        'click  .show-measure-group-del'     : 'show_measure_group_form',
        'click  .show-measure-group-no'      : 'show_measure_group_form',
        'click  .measure-group-add'          : 'form_measure_group',
        'click  .measure-group-del'          : 'form_measure_group',
        'click  .measure-group-cancel'       : 'cancel_measure_group',
        'keyup  #measure-group-name'         : 'remove_validation',
        
        'click  .show-measure-add'           : 'show_measure_form',
        'click  .show-measure-edit'          : 'show_measure_form',
        'click  .show-measure-del'           : 'show_measure_form',
        'click  .measure-add'                : 'form_measure',
        'click  .measure-del'                : 'form_measure',
        'click  .measure-back'               : 'back_measure',
        'click  .show-measure-no'            : 'back_measure',
        'keyup  #measure-name'               : 'remove_validation',
        'change #measure-select-col'         : 'remove_validation',
        'change #measure-select-agg'         : 'remove_validation',

        'click .show-dimlink-add'            : 'show_dimlink_form',
        'click .show-dimlink-edit'           : 'show_dimlink_form',
        'click .show-dimlink-del'            : 'show_dimlink_form',
        'click .dimlink-add'                 : 'form_dimlink',
        'click .dimlink-del'                 : 'form_dimlink',
        'click .dimlink-back'                : 'back_dimlink',
        'click .show-dimlink-no'             : 'back_dimlink',
        'change #dimlink-select-dim'         : 'remove_validation',
        'change #dimlink-select-fk'          : 'remove_validation'
    },
    
    initialize: function(args) {
        // Initialize properties
        // this.args = args.dialog;
        this.args = args.data;
        this.saveCubeDim = new Saiku.singleton();
        if (this.saveCubeDim.get() === undefined) {
            this.saveCubeDim.set(false);
        }

        // Maintain `this`
        _.bindAll(this, 'cancel_cube_dim', 'remove_annotation_time');

        var self = this,
            tables = this.args.mondrianSchema.get('physicalschema').tables.toJSON();
            tables = this.populate_modal_tables(tables);
        if (tables) {
            var data = { tables: this.tables_template({ repoObjects: tables }) };
        }
        else {
            tables = this.args.mondrianSchema.get('physicalschema').tables.toJSON();
            var data = { tables: this.tables_template({ repoObjects: tables }) };
        }

        this.message = _.template(
            '<div class="add-cubes-dim">' +
                '<div class="container-12">' +
                    // Tables Physical Schema
                    '<div class="grid-4">' +
                        '<div class="box">' +
                            '<div class="title">' +
                                '<h3 class="i18n">Tables Physical Schema</h3>' +
                            '</div>' +
                            '<div class="stack-tables">' +
                                '<div class="accordion">' +
                                    '<ul class="tables-list"><%= tables %></ul>' +
                                '</div>'+
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Available Fields
                    '<div class="grid-4">' +
                        '<div class="box">' +
                            '<div class="title">' +
                                '<h3 class="i18n">Available Fields</h3>' +
                            '</div>' +
                            '<div class="stack-items">' +
                                '<div class="accordion">' +
                                    '<ul class="list-items"></ul>' +
                                '</div>'+
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // View Options
                    '<div class="grid-4">' +
                        '<div class="box">' +
                            '<div class="title">' +
                                '<h3 class="i18n">View Options</h3>' +
                                '<a href="#context_menu_options" class="context-menu-options"><i class="fa fa-cog"></i></a>' +
                            '</div>' +
                            '<div class="view-options"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        )(data);

        this.bind('open', function() {
            var dialogH;

            this.$el.dialog('option', 'position', 'center');
            this.$el.parents('.ui-dialog').css({ width: '90%', height: '90%' });

            // Centering Percentage Width/Height Elements
            // @link: http://css-tricks.com/centering-percentage-widthheight-elements/
            this.$el.parents('.ui-dialog').css({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

            dialogH = this.$el.parents('.ui-dialog').height();

            this.$el.parents('.ui-dialog').find('.add-cubes-dim').height(dialogH - 80);

            this.$el.parents('.ui-dialog').find('.ui-dialog-titlebar-close').bind('click', self.cancel_cube_dim);

            self.populate_modal_dims();
            self.populate_modal_cubes();
            self.draggable_table();
            self.droppable_table();

            if (self.saveCubeDim.get() === false) {
                self.save_cube('Cube 1', null, { cubeName: 'Cube 1', action: 'cad', notify: false });
                setTimeout(function() {
                    self.save_measure_group('Cube 1', 'Default', null, { name: 'Default', action: 'cad', notify: false });
                }, 1000);
            }

            self.clone_model('old');
        });
    },
    help_cube: function(type){
        var win = window.open("http://wiki.meteorite.bi/display/SAIK/Creating+schema+using+Saiku+Schema+Designer#CreatingschemausingSaikuSchemaDesigner-CreatingCubes", '_blank');
        win.focus();
    },
    guid: function(type){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();

    },
    clone_model: function(type) {
        if (type === 'old') {
            this.args.mondrianSchemaOld = this.args.mondrianSchema.clone();
            this.args.mondrianSchemaOld.cubes = this.args.mondrianSchema.cubes.clone();
            this.args.mondrianSchemaOld.dimension = this.args.mondrianSchema.dimension.clone();
        }
        else if (type === 'actual') {
            this.args.mondrianSchema = this.args.mondrianSchemaOld.clone();
            this.args.mondrianSchema.cubes = this.args.mondrianSchemaOld.cubes.clone();
            this.args.mondrianSchema.dimension = this.args.mondrianSchemaOld.dimension.clone();
        }
    },

    set_model: function(type) {
        if (type === 'old') {
            this.args.mondrianSchemaOld.set(this.args.mondrianSchema.attributes);
            this.args.mondrianSchemaOld.cubes = this.args.mondrianSchema.cubes;
            this.args.mondrianSchemaOld.dimension = this.args.mondrianSchema.dimension;
        }
        else if (type === 'actual') {
            this.args.mondrianSchema.set(this.args.mondrianSchemaOld.attributes);
            this.args.mondrianSchema.cubes = this.args.mondrianSchemaOld.cubes;
            this.args.mondrianSchema.dimension = this.args.mondrianSchemaOld.dimension;
        }
    },

    populate_modal_tables: function(tables) {
        if (this.saveCubeDim.get()) {
            var objTables = this.args.mondrianSchema.dimension.toJSON(),
                len = objTables.length,
                aux = 0,
                i = 0;

            while (aux < len) {
                if (tables[i].id === objTables[aux].table) {
                    tables[i].selected = true;
                    aux++;
                    i = 0;
                }
                else {
                    i++;
                }
            }

            return tables;
        }
        else {
            return false;
        }
    },

    populate_modal_dims: function() {
        if (this.saveCubeDim.get()) {
            var objDims = this.args.mondrianSchema.dimension.toJSON(),
                len = objDims.length,
                html,
                i;

            var objAttrs = {
                dims: [],
                vals: []
            };

            var objHiers = {
                dims: [],
                vals: []  
            };

            var attr,
                hier;

            if (len > 0) {
                for (i = 0; i < len; i++) {
                    html = $(
                        '<li class="item" data-dimension="' + objDims[i].id + '" data-type="' + objDims[i].type.toLowerCase() + '">' +
                            '<input type="checkbox" name="accordion-radio">' +
                            '<strong class="dimension-name">Dimension: <a class="show-dim-edit" href="#show_dim_form">' + objDims[i].name + '</a></strong>' +
                            '<div>' +
                                '<table class="table-items">' +
                                    '<thead>' + 
                                        '<tr>' +
                                            '<th>Attributes</th>' +
                                            '<th>' +
                                                '<a class="action show-attr-add" href="#show_attribute_form">' + 
                                                    '<i class="fa fa-plus-square fa-lg"></i>' +
                                                '</a>' +
                                            '</th>' +
                                        '</tr>' +
                                    '</thead>' + 
                                    '<tbody class="view-attr">' + 
                                    '</tbody>' + 
                                '</table>' +
                                '<table class="table-items">' +
                                    '<thead>' +
                                        '<tr>' +
                                            '<th>Hierarchies</th>' +
                                            '<th>' +
                                                '<a class="action show-hier-add" href="#">' +
                                                    '<i class="fa fa-plus-square fa-lg"></i>' +
                                                '</a>' +
                                            '</th>' +
                                        '</tr>' +
                                    '</thead>' + 
                                    '<tbody class="view-hier">' + 
                                    '</tbody>' + 
                                '</table>' +
                            '</div>' +
                        '</li>'
                    );

                    html.appendTo(this.$el.parents('.ui-dialog').find('.list-items'));

                    // Get attributes
                    attr = this.args.mondrianSchema.dimension.get(objDims[i].id);
                    objAttrs.dims.push(objDims[i].id);
                    objAttrs.vals.push(attr.atb.models[0].attribute.toJSON());

                    // Get hierarchies
                    hier = this.args.mondrianSchema.dimension.get(objDims[i].id);
                    objHiers.dims.push(objDims[i].id);
                    objHiers.vals.push(hier.hierarchies.models[0].hierarchy.toJSON());
                }

                this.populate_modal_attrs(objAttrs);
                this.populate_modal_hiers(objHiers);
            }
        }
    },

    populate_modal_attrs: function(attrs) {
        var iLen = attrs.dims.length,
            jLen,
            i, j,
            html;

        for (i = 0; i < iLen; i++) {
            for (j = 0, jLen = attrs.vals[i].length; j < jLen; j++) {
                if (attrs.vals[i].length > 0) {
                    html = '<tr class="sub-item" data-attr="' + attrs.vals[i][j].name + '">' +
                               '<td>' + attrs.vals[i][j].name + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-attr-del" href="#show_attribute_form" data-attr-name="' + attrs.vals[i][j].name + '" data-attr-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-attr-edit" href="#show_attribute_form" data-attr-name="' + attrs.vals[i][j].name + '" data-attr-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                    $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                        if ($(this).data('dimension') === attrs.dims[i]) {
                            $(this).closest('.item').find('.view-attr').append(html);
                        }
                    });
                }
            }
        }
    },

    populate_modal_hiers: function(hiers) {
        var iLen = hiers.dims.length,
            jLen,
            i, j,
            html;        

        for (i = 0; i < iLen; i++) {
            for (j = 0, jLen = hiers.vals[i].length; j < jLen; j++) {
                if (hiers.vals[i].length > 0) {
                    html = '<tr class="sub-item" data-hier="' + hiers.vals[i][j].name + '">' +
                               '<td>' + hiers.vals[i][j].name + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-hier-del" href="#show_hierarchy_form" data-hier-name="' + hiers.vals[i][j].name + '" data-hier-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-hier-edit" href="#show_hierarchy_form" data-hier-name="' + hiers.vals[i][j].name + '" data-hier-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                    $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                        if ($(this).data('dimension') === hiers.dims[i]) {
                            $(this).closest('.item').find('.view-hier').append(html);
                        }
                    });
                }
            }
        }
    },

    populate_modal_cubes: function() {
        if (this.saveCubeDim.get()) {
            var objCubes = this.args.mondrianSchema.cubes.toJSON(),
                len = objCubes.length,
                html,
                i;

            var objMeasures = {
                cubes: [],
                vals: []
            };

            if (len > 0) {
                for (i = 0; i < len; i++) {
                    html = $(
                        '<li class="item" data-cube="' + objCubes[i].name + '">' +
                            '<input type="checkbox" name="accordion-radio">' +
                            '<strong class="cube-name">Cube: <a class="show-cube-edit" href="#show_cube_form" data-action="edit">' + objCubes[i].name + '</a></strong>' +
                            '<div>' +
                                '<table class="table-items">' +
                                    '<thead>' + 
                                        '<tr>' +
                                            '<th>Measure Groups</th>' +
                                            '<th>' +
                                                '<a class="action show-measure-group" href="#add_attr"><i class="fa fa-plus-square fa-lg"></i></a>' +
                                            '</th>' +
                                        '</tr>' +
                                    '</thead>' + 
                                    '<tbody class="view-measure-groups">' + 
                                    '</tbody>' + 
                                '</table>' +
                            '</div>' +
                        '</li>'
                    );

                    this.$el.parents('.ui-dialog').find('.list-items').append(html);

                    // Get measures
                    objMeasures.cubes.push(objCubes[i].name);
                    objMeasures.vals.push(this.args.mondrianSchema.cubes.get(objCubes[i].name).measuregroups.toJSON());
                }

                this.populate_modal_measures(objMeasures);
            }
        }
    },

    populate_modal_measures: function(measures) {
        var iLen = measures.cubes.length,
            jLen,
            i, j,
            html;

        for (i = 0; i < iLen; i++) {
            for (j = 0, jLen = measures.vals[i].length; j < jLen; j++) {
                if (measures.vals[i].length > 0) {
                    html = '<tr class="sub-item" data-measure-group="' + measures.vals[i][j].name + '">' +
                                   '<td>' + measures.vals[i][j].name + '</td>' +
                                   '<td>' +
                                       '<a class="action fa-lg show-measure-group-del" href="#" data-measure-group-name="' + measures.vals[i][j].name + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                       '<a class="action fa-lg show-measure-group-edit" href="#" data-measure-group-name="' + measures.vals[i][j].name + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                                   '</td>' +
                               '</tr>';

                    $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                        if ($(this).data('cube') === measures.cubes[i]) {
                            $(this).closest('.item').find('.view-measure-groups').append(html);
                        }
                    });
                }
            }
        }
    },

    check_dimension_key: function(dimName, attrNameOld, attrName) {
        var dimension = this.args.mondrianSchema.dimension.get(dimName),
            objDim = dimension.toJSON();

        if (objDim.key === attrNameOld) {
            dimension.set({
                key: attrName
            });
        }
    },

    check_dim_key: function() {
        var objDims = this.args.mondrianSchema.dimension.toJSON(),
            len = objDims.length,
            isChecked = false,
            i;

        if (objDims && !(_.isEmpty(objDims))) {
            for (i = 0; i < len; i++) {
                if (objDims[i].key === undefined || 
                    objDims[i].key === null ||
                    objDims[i].key === '') {
                    isChecked = false;
                    $.notify('Add a key for dimension: ' + objDims[i].name, {
                        globalPosition: 'top center', 
                        className: 'warn' 
                    });
                    break;
                }
                else {
                    isChecked = true;
                }
            }
        }
        else {
            isChecked = true;
        }

        return isChecked;
    },

    check_dim_factlink: function(dimName) {
        var objDims = this.args.mondrianSchema.dimension.toJSON(),
            len = objDims.length,
            isChecked = false,
            i;

        if (objDims && !(_.isEmpty(objDims))) {
            for (i = 0; i < len; i++) {
                if (objDims[i].name === dimName) {
                    isChecked = true;
                    break;
                }
                else {
                    isChecked = false;
                }
            }
        }
        else {
            isChecked = false;
        }

        return isChecked;
    },

    save_cube_dim: function(event) {
        event.preventDefault();
        if (this.check_dim_key()) {
            this.saveCubeDim.set(true);
            this.set_model('old');
            this.$el.dialog('destroy').remove();
        }
    },

    cancel_cube_dim: function(event) {
        event.preventDefault();
        this.saveCubeDim.set(true);
        this.set_model('actual');
        this.$el.dialog('destroy').remove();
    },

    clear_cube_dim: function() {
        var objCubes = this.args.mondrianSchema.cubes.toJSON(),
            objDims = this.args.mondrianSchema.dimension.toJSON(),
            lenCubes = objCubes.length,
            lenDims = objDims.length,
            i, j;

        for (i = 0; i < lenCubes; i++) {
            this.args.mondrianSchema.cubes.remove(objCubes[i].id);
        }

        for (j = 0; j < lenDims; j++) {
            this.args.mondrianSchema.dimension.remove(objDims[j].id);
        }

        this.clear_modal();

        this.saveCubeDim.set(false);
    },

    clear_modal: function() {
        // Remove dimension
        $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
            $(this).closest('.item').remove();
        });

        // Show table in "Tables Physical Schema"
        $(this.$el.parents('.ui-dialog').find('.tables-list').find('.table')).each(function() {
            $(this).closest('.table').show();
        });

        this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();
    },

    draggable_table: function() {
        var zindex = 10;
        this.$el.parents('.ui-dialog').find('.table').draggable({
            cancel      : '.not-draggable',         
            cursor      : isFF ? '-moz-grabbing' : '-webkit-grabbing',
            helper      : 'clone',
            opacity     : 0.60,
            placeholder : 'placeholder',
            scroll      : false,
            tolerance   : 'touch',
            revert: function(event, ui) {
                $(this).css('border', '1px solid #ccc');
                return !event;
            },
            start: function(event, ui) {
                $(this).css('z-index', zindex++);
                $(this).css('border', '2px solid #333');
            },
            drag: function(event, ui) {
                $(ui.helper).css('z-index', zindex++);
                $(ui.helper).find('input').remove();
                $(ui.helper).find('div').remove();
            }
        });
    },

    droppable_table: function() {
        var self = this;

        this.$el.parents('.ui-dialog').find('.stack-items').droppable({
            hoverClass: 'over',
            drop: function(event, ui) {
                var g = jQuery.guid++;

                var tableName = $(ui.draggable).closest('.table').data('table'),
                    element = $(
                        '<li class="item" data-dimension="' + tableName + '_'+g+'" data-type="standard">' +
                            '<input type="checkbox" name="accordion-radio">' +
                            '<strong class="dimension-name">Dimension: <a class="show-dim-edit" href="#show_dim_form">' + tableName + '</a></strong>' +
                            '<div>' +
                                '<table class="table-items">' +
                                    '<thead>' + 
                                        '<tr>' +
                                            '<th>Attributes</th>' +
                                            '<th>' +
                                                '<a class="action show-attr-add" href="#add_attr">' + 
                                                    '<i class="fa fa-plus-square fa-lg"></i>' +
                                                '</a>' +
                                            '</th>' +
                                        '</tr>' +
                                    '</thead>' + 
                                    '<tbody class="view-attr">' + 
                                    '</tbody>' + 
                                '</table>' +
                                '<table class="table-items">' +
                                    '<thead>' +
                                        '<tr>' +
                                            '<th>Hierarchies</th>' +
                                            '<th>' +
                                                '<a class="action show-hier-add" href="#">' +
                                                    '<i class="fa fa-plus-square fa-lg"></i>' +
                                                '</a>' +
                                            '</th>' +
                                        '</tr>' +
                                    '</thead>' + 
                                    '<tbody class="view-hier">' + 
                                    '</tbody>' + 
                                '</table>' +
                            '</div>' +
                        '</li>'
                    );

                element.appendTo($(this).find('.list-items'));

                //$(ui.draggable).hide();
                //var guid = guid();
                self.save_dimension(tableName, tableName, null, { action: 'cad' }, null, tableName+"_"+g);
                self.show_dim_attr_form(tableName, tableName+"_"+g);
            }
        });
    },

    capitalize: function(str) {
        str = str.replace(/[^a-zA-Z 0-9]/gi, ' ');
        return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    },

    context_menu_options: function(event) {
        event.preventDefault();

        var menuItems = {
            'addNewCube': {name: 'Add new cube' },
            'clearModal': {name: 'Clear Cubes & Dimensions' },
            // 'createSchema': {name: 'Test Create Schema' }
        };

        var self = this;

        $.contextMenu('destroy', '.context-menu-options');
        $.contextMenu({
            selector: '.context-menu-options',
            trigger: 'left',
            callback: function(key, options) {
                if (key === 'addNewCube') {
                    self.show_cube_form();
                }
                else if (key === 'clearModal') {
                    self.clear_cube_dim();   
                }
                else if (key === 'createSchema') {
                    self.args.create_schema();   
                }
            },
            items: menuItems
        });
    },

    show_table_columns: function(event) {
        var $currentTarget = $(event.currentTarget),
            tableName = $currentTarget.closest('.table').data('table'),
            currentSchema = this.args.currentSchema,
            objDatabase = this.args.currentDatabase.schemas.get(currentSchema),
            objTable = objDatabase.tables.get(tableName),
            columns = this.table_list_template({ data: objTable.columns.toJSON2() });
        $currentTarget.closest('.table').find('.table-columns-list').empty();
        $currentTarget.closest('.table').find('.table-columns-list').append(columns);
    },

    button_easytabs: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget),
            tabSelector = $currentTarget.closest('.tab-container').attr('id'),
            tabValue = $currentTarget.data('tab');
        $('#' + tabSelector).easytabs('select', '#tab' + tabValue);
    },

    tables_template: function(obj) {
        return _.template(
            '<% _.each(obj.repoObjects, function(entry) { %>' +
                '<li class="table cursor-grab" data-table="<%= entry.name %>">' +
                    '<input type="checkbox" class="table-toggle" name="accordion-toggle">' +
                    '<strong><%= entry.name %></strong>' +
                    '<div>' + 
                        '<table>' +
                            '<tbody class="table-columns-list">' + 
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</li>' +
            '<% }); %>'
        )(obj);
    },

    table_list_template: function(obj) {
        return _.template(
            '<% if (obj.data.length > 3) { %>' + 
                '<% for (var i = 0; i <= 3; i++) { %>' +
                    '<tr class="truncate">' +
                        '<td><%= obj.data[i].name %></td>' +
                    '</tr>' +
                '<% } %>' +
                '<tr class="column">' +
                    '<td>...</td>' + 
                '</tr>' +
            '<% } else { %>' +
                '<% _.each(obj.data, function(entry) { %>' +
                    '<tr class="truncate">' +
                        '<td><%= entry.name %></td>' +
                    '</tr>' +
                '<% }); %>'+
            '<% } %>'
        )(obj);
    },

    option_template: function(obj) {
        return _.template(
            '<% if (obj.multiple === false) { %>' +
                '<option value="">-- Select --</option>' +
            '<% } %>' +
            '<% if (obj.addValue) { %>' +
                '<% _.each(obj.repoObjects, function(entry) { %>' +
                    '<option value="<%= entry.value %>"><%= entry.name %></option>' +
                '<% }); %>' +
            '<% } else if (obj.table) { %>' +
                '<% _.each(obj.repoObjects, function(entry) { %>' +
                    '<option value="<%= entry.name %>" data-table="<%= entry.table %>"><%= entry.name %></option>' +
                '<% }); %>' +
            '<% } else if (obj.addId) { %>' +
                '<% _.each(obj.repoObjects, function(entry) { %>' +
                    '<option value="<%= entry.id %>" data-table="<%= entry.table %>"><%= entry.name %></option>' +
            '<% }); %>' +
            '<% } else { %>' +
                '<% _.each(obj.repoObjects, function(entry) { %>' +
                    '<option value="<%= entry.name %>"><%= entry.name %></option>' +
                '<% }); %>' +
            '<% } %>'
        )(obj);
    },

    dimension_attr_template: function(obj) {
        return _.template(
            '<form class="form-group">' +
                '<label for="dim-attr-info">Auto generate all the attributes from every column of <strong><%= obj.table %></strong>?</label>' +
                '<input type="hidden" id="dim-attr-name" value="<%= obj.dimension %>">' +
                '<div class="form-buttons">' +
                    '<a class="form_button dim-attr-add" href="#form_dimension_attr" data-dimid="<%= obj.dimension %>"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                    '<a class="form_button show-dim-attr-no" href="#show_dim_form" data-dimid="<%= obj.dimension %>"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                '</div>' +
            '</form>'
        )(obj);
    },

    dimension_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            var objCubes = this.args.mondrianSchema.cubes.toJSON();
            obj.cubes = objCubes
            return _.template(
                '<form class="form-group">' +
                    '<label for="dim-table">Table:</label>' +
                    '<input type="text" id="dim-table" value="<%= obj.table %>" disabled>' +
                    '<label for="dim-name">Dimension Name:</label>' +
                    '<input type="text" id="dim-name" value="<%= obj.name %>">' +
                    '<span class="error err-1" hidden>This field is required</span>' +
                    '<label for="dim-select-key">Select Key:</label>' +
                    '<select id="dim-select-key"><%= obj.columns %></select>' +
                    '<span class="error err-2" hidden>This field is required</span>' +
                    '<label for="dim-select-type">Select Type:</label>' +
                    '<select id="dim-select-type">' +
                        '<% if (obj.type === "TIME") { %>' +
                            '<option value="standard">Standard</option>' +
                            '<option value="time" selected>Time</option>' +
                        '<% } else { %>' +
                            '<option value="standard" selected>Standard</option>' +
                            '<option value="time">Time</option>' +
                        '<% } %>' +
                    '</select>' +
                    '<input type="hidden" id="dim-action" value="<%= obj.action %>" data-dimid="<%= obj.dimid %>" data-name="<%= obj.name %>">' +
                    /*'<label for="dim-degenerate">Select Cube:</label>' +
                    '<select id="dim-degenerate"><option value="shared">Shared</option>' +
                    '<% _(obj.cubes).each(function(pl) { %>'+
                        '<option value="pl.id"><%= pl.name %></option>' +
                    '<% }); %>'+
                    '</select>'+*/
                    '<div class="form-buttons">' +
                        '<a class="form_button dim-edit" href="#form_dimension"><i class="fa fa-check"></i>&nbsp;Update&nbsp;</a>' +
                        '<a class="form_button show-dim-del" href="#show_dim_form" data-table="<%= obj.table %>" data-name="<%= obj.name %>" data-dimid="<%= obj.dimid %>" data-action="del"><i class="fa fa-close"></i>&nbsp;Delete&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj, objCubes);
        }
        else {
            return _.template(
                '<form class="form-group">' +
                    '<label for="dim-info">Want to remove the dimension <strong><%= obj.name %></strong>?</label>' +
                    '<input type="hidden" id="dim-name" value="<%= obj.name %>">' +
                    '<input type="hidden" id="dim-action" value="<%= obj.action %>" data-dimid="<%= obj.dimid %>" data-table="<%= obj.tablePhysicalSchema %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button dim-del" href="#form_dimension"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-dim-no" href="#show_dim_form" data-dimid="<%= obj.dimid %>" data-name="<%= obj.name %>"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
    },

    attribute_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<form class="form-group">' +
                    '<label for="attr-name">Attribute Name:</label>' +
                    '<input type="text" id="attr-name" value="<%= obj.name %>">' +
                    '<span class="error err-1" hidden>This field is required</span>' +
                    '<label for="attr-key-column">Select Key:</label>' +
                    '<select class="attr-key-column" id="attr-key-column" multiple><%= obj.columns %></select>' +
                    '<% if (obj.isNameColumn) { %>' +
                        '<span class="group-attr-name-column">' +
                            '<label for="attr-name-column">Select Name:</label>' +
                            '<select id="attr-name-column"><%= obj.nameColumns %></select>' +
                        '</span>' +
                    '<% } else { %>' +
                        '<span class="group-attr-name-column" hidden>' +
                            '<label for="attr-name-column">Select Name:</label>' +
                            '<select id="attr-name-column"><%= obj.nameColumns %></select>' +
                        '</span>' +
                    '<% } %>' +
                    '<span class="error err-2" hidden>This field is required</span>' +
                    '<% if (obj.action === "cad" && obj.type === "time") { %>' +
                        '<label for="attr-level-type">Select Level Types:</label>' +
                        '<select id="attr-level-type">' +
                            '<option value="">-- Select --</option>' +
                            '<option value="Regular">Regular</option>' +
                            '<option value="TimeYears">Time Years</option>' +
                            '<option value="TimeHalfYears">Time Half Years</option>' +
                            '<option value="TimeQuarters">Time Quarters</option>' +
                            '<option value="TimeMonths">Time Months</option>' +
                            '<option value="TimeWeeks">Time Weeks</option>' +
                            '<option value="TimeDays">Time Days</option>' +
                            '<option value="TimeHours">Time Hours</option>' +
                            '<option value="TimeMinutes">Time Minutes</option>' +
                            '<option value="TimeSeconds">Time Seconds</option>' +
                        '</select>' +
                        '<span class="error err-3" hidden>This field is required</span>' +
                    '<% } if (obj.action === "edit" && obj.type === "time") { %>' +
                        '<label for="attr-level-type">Select Level Types:</label>' +
                        '<select id="attr-level-type"><%= obj.levelTypes %></select>' +
                        '<span class="error err-3" hidden>This field is required</span>' +
                    '<% } %>' +
                    '<label for="attr-has-hierarchy">Has Hierarchy?</label>' +
                    '<input type="checkbox" id="attr-has-hierarchy" <%= obj.hashierarchy %>/>' +
                    '<input type="hidden" id="attr-dim-name" value="<%= obj.dimension %>" data-type="<%= obj.type %>">' +
                    '<input type="hidden" id="attr-action" value="<%= obj.action %>" data-name="<%= obj.name %>" data-name-column="<%= obj.nameColumn %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button attr-add" href="#form_attribute"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                        '<a class="form_button attr-cancel" href="#cancel_attribute"><i class="fa fa-close"></i>&nbsp;Cancel&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group">' +
                    '<label for="attr-info">Want to remove the attribute <strong><%= obj.name %></strong>?</label>' +
                    '<input type="hidden" id="attr-dim-name" value="<%= obj.dimension %>" data-type="<%= obj.type %>">' +
                    '<input type="hidden" id="attr-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button attr-del" href="#form_attribute"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-attr-no" href="#show_attribute_form" data-dimension="<%= obj.dimension %>" data-attr-name="<%= obj.name %>" data-attr-action="edit"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);   
        }
    },

    hierarchy_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<div class="tab-container" id="tab-hierarchy">' +
                    '<ul class="etabs">' +
                        '<li class="tab"><a href="#tab1">Hierarchy</a></li>' +
                        '<li class="tab"><a href="#tab2">Levels</a></li>' +
                    '</ul>' +
                    '<div class="panel-container">' +
                        '<div id="tab1">' +
                            '<form class="form-group">' +
                                '<label for="hier-name">Hierarchy Name:</label>' +
                                '<input type="text" class="input-sm" id="hier-name" value="<%= obj.name %>">' +
                                '<span class="error err-1" hidden>This field is required</span>' +
                                '<label for="hier-all-member-name">All member name:</label>' +
                                '<input type="text" class="input-sm" id="hier-all-member-name" value="<%= obj.allMemberName %>">' +
                                '<span class="error err-2" hidden>This field is required</span>' +
                                '<input type="hidden" id="hier-dim-name" value="<%= obj.dimension %>" data-type="<%= obj.type %>">' +
                                '<input type="hidden" id="hier-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                                '<div class="form-buttons">' +
                                    '<a class="form_button button-tabs" href="#button_easytabs" data-tab="2">&nbsp;Next &raquo;&nbsp;</a>' +
                                '</div>' +
                            '</form>' +
                        '</div>' +
                        '<div id="tab2">' +
                            '<div class="view-options-level"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group">' +
                    '<label for="hier-info">Want to remove the hierarchy <strong><%= obj.name %></strong>?</label>' +
                    '<input type="hidden" id="hier-dim-name" value="<%= obj.dimension %>">' +
                    '<input type="hidden" id="hier-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button hier-del" href="#form_hierarchy"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-hier-no" href="#show_hierarchy_form" data-dimension="<%= obj.dimension %>" data-hier-name="<%= obj.name %>" data-hier-action="edit"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);   
        }
    },

    level_template: function(obj) {
        return _.template(
            '<form class="form-group">' +
                '<label for="level-select">Level:</label>' +
                '<select class="chosen-select select-sm" id="level-select" multiple><%= obj.attr %></select>' +
                '<div class="form-buttons">' +
                    '<a class="form_button button-tabs" href="#button_easytabs" data-tab="1">&nbsp;&laquo; Back&nbsp;</a>' +
                    '<a class="form_button hier-add" href="#form_hierarchy"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                    '<a class="form_button hier-cancel" href="#cancel_hierarchy"><i class="fa fa-close"></i>&nbsp;Cancel&nbsp;</a>' +
                '</div>' +
            '</form>'
        )(obj);
    },

    option_level_template: function(obj) {
        return _.template(
            '<% _.each(obj.repoObjects, function(entry) { %>' +
                '<% if (entry.selected) { %>' +
                    '<option value="<%= entry.name %>" selected><%= entry.name %></option>' +
                '<% } else { %>' +
                    '<option value="<%= entry.name %>"><%= entry.name %></option>' +
                '<% } %>' +
            '<% }); %>'
        )(obj);
    },

    annotation_time_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<form class="form-group annotation-time-template">' +
                    '<label for="level-name">Level Name: <strong><%= obj.levelName %></strong></label><br>' +
                    '<label for="annotation-time-raw">Annotation:</label>' +
                    '<input type="text" id="annotation-time-raw" value="<%= obj.annotation %>">' +
                    '<span class="error err-3" hidden>This field is required</span>' +
                    '<input type="hidden" id="annotation-time-action" value="<%= obj.action %>" data-level="<%= obj.levelName %>" data-annotation="<%= obj.annotation %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button annotation-time-back" href="#back_annotation_time">&nbsp;&laquo; Back&nbsp;</a>' +
                        '<a class="form_button annotation-time-add" href="#form_annotation_time"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                        '<% if (obj.action === "edit") { %>' +
                            '<a class="form_button show-annotation-time-del" href="#show_annotation_time_form" data-annotation="<%= obj.annotation %>" data-action="del"><i class="fa fa-close"></i>&nbsp;Delete&nbsp;</a>' +
                        '<% } %>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group annotation-time-del-template">' +
                    '<label for="annotation-time-info">Want to remove the annotation <strong><%= obj.annotation %></strong>?</label>' +
                    '<div class="form-buttons">' +
                        '<a class="form_button annotation-time-del" href="#form_annotation_time" data-action="<%= obj.action %>"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-annotation-time-no" href="#back_annotation_time_del" data-annotation="<%= obj.annotation %>"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);   
        }
    },

    cube_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<form class="form-group">' +
                    '<label for="cube-name">Cube Name:</label>' +
                    '<input type="text" id="cube-name" value="<%= obj.name %>">' +
                    '<span class="error err-1" hidden>This field is required</span>' +
                    '<label for="cube-measures">Default Measure:</label>' +
                    '<select id="cube-measures"><%= obj.measures %></select>' +
                    '<input type="hidden" id="cube-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button cube-add" href="#form_cube"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                        '<% if (obj.action === "cad") { %>' +
                            '<a class="form_button cube-cancel" href="#cancel_cube"><i class="fa fa-close"></i>&nbsp;Cancel&nbsp;</a>' +
                        '<% } else { %>' +
                            '<a class="form_button cube-cancel" href="#cancel_cube" hidden><i class="fa fa-close"></i>&nbsp;Cancel&nbsp;</a>' +
                            '<a class="form_button show-cube-del" href="#show_cube_form" data-name="<%= obj.name %>" data-action="del"><i class="fa fa-close"></i>&nbsp;Delete&nbsp;</a>' +
                        '<% } %>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group">' +
                    '<label for="cube-info">Want to remove the cube <strong><%= obj.name %></strong>?</label>' +
                    '<input type="hidden" id="cube-name" value="<%= obj.name %>">' +
                    '<input type="hidden" id="cube-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button cube-del" href="#form_cube"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-cube-no" href="#show_cube_form" data-name="<%= obj.name %>"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);   
        }
    },

    measure_group_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<div class="tab-container" id="tab-measure">' +
                    '<ul class="etabs">' +
                        '<li class="tab"><a href="#tab1">Measure Group</a></li>' +
                        '<li class="tab"><a href="#tab2">Measures</a></li>' +
                        '<li class="tab"><a href="#tab3">Link Dimensions</a></li>' +
                    '</ul>' +
                    '<div class="panel-container">' +
                        '<div id="tab1">' +
                            '<form class="form-group">' +
                                '<label for="measure-group-name">Measure Group Name:</label>' +
                                '<input type="text" id="measure-group-name" value="<%= obj.measureGroupName %>">' +
                                '<span class="error err-1" hidden>This field is required</span>' +
                                '<label for="measure-group-select-table">Select Table:</label>' +
                                '<select id="measure-group-select-table"><%= obj.table %></select>' +
                                '<span class="error err-2" hidden>This field is required</span>' +
                                '<input type="hidden" id="measure-group-cube-name" value="<%= obj.cube %>">' +
                                '<input type="hidden" id="measure-group-action" value="<%= obj.action %>" data-name="<%= obj.measureGroupName %>">' +
                                '<div class="form-buttons">' +
                                    '<a class="form_button button-tabs" href="#button_easytabs" data-tab="2">&nbsp;Next &raquo;&nbsp;</a>' +
                                '</div>' +
                            '</form>' +
                        '</div>' +
                        '<div id="tab2">' +
                            '<div class="view-options-measures"></div>' +
                        '</div>' +
                        '<div id="tab3">' +
                            '<div class="view-options-dimlinks"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group">' +
                    '<label for="hier-info">Want to remove the measure group <strong><%= obj.measureGroupName %></strong>?</label>' +
                    '<input type="hidden" id="measure-group-cube-name" value="<%= obj.cube %>">' +
                    '<input type="hidden" id="measure-group-action" value="<%= obj.action %>" data-name="<%= obj.measureGroupName %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button measure-group-del" href="#form_measure_group"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-measure-group-no" href="#show_measure_group_form" data-cube="<%= obj.cube %>" data-name="<%= obj.measureGroupName %>" data-action="edit"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
    },

    table_measures_template: function() {
        return _.template(
            '<table class="view-options-table">' +
                '<thead>' + 
                    '<tr>' +
                        '<th>List of measures</th>' +
                        '<th>' +
                            '<a class="action show-measure-add" href="#show_measure_form" data-action="cad"><i class="fa fa-plus-square fa-lg"></i></a>' +
                        '</th>' +
                    '</tr>' +
                '</thead>' + 
                '<tbody class="view-measures"></tbody>' + 
            '</table>' +
            '<form class="form-group">' +
                '<div class="form-buttons">' +
                    '<a class="form_button button-tabs" href="#button_easytabs" data-tab="1">&nbsp;&laquo; Back&nbsp;</a>' +
                    '<a class="form_button button-tabs" href="#button_easytabs" data-tab="3">&nbsp;Next &raquo;&nbsp;</a>' +
                '</div>' +
            '</form>'
        )();
    },

    measures_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<form class="form-group measure-template">' +
                    '<label for="measure-name">Measure Name:</label>' +
                    '<input type="text" id="measure-name" value="<%= obj.name %>">' +
                    '<span class="error err-3" hidden>This field is required</span>' +
                    '<label for="measure-select-col">Select Column:</label>' +
                    '<select id="measure-select-col"><%= obj.column %></select>' +
                    '<span class="error err-4" hidden>This field is required</span>' +
                    '<label for="measure-select-agg">Select Aggregation:</label>' +
                    '<% if (obj.action === "cad") { %>' +
                        '<select id="measure-select-agg">' +
                            '<option value="">-- Select --</option>' +
                            '<option value="sum">Sum</option>' +
                            '<option value="count">Count</option>' +
                            '<option value="avg">Average</option>' +
                            '<option value="max">Max</option>' +
                            '<option value="min">Min</option>' +
                        '</select>' +
                        '<span class="error err-5" hidden>This field is required</span>' +
                    '<% } else { %>' +
                        '<select id="measure-select-agg"><%= obj.aggregator %></select>' +
                        '<span class="error err-5" hidden>This field is required</span>' +
                    '<% } %>' +
                    '<label for="measure-formatstring">Format String:</label>' +
                    '<input type="text" id="measure-formatstring" value="<%= obj.formatstring %>">' +
                    '<input type="hidden" id="measure-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button measure-back" href="#back_measure">&nbsp;&laquo; Back&nbsp;</a>' +
                        '<a class="form_button measure-add" href="#form_measure"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group measure-template">' +
                    '<label for="measure-info">Want to remove the measure <strong><%= obj.name %></strong>?</label>' +
                    '<input type="hidden" id="measure-name" value="<%= obj.name %>">' +
                    '<input type="hidden" id="measure-action" value="<%= obj.action %>" data-name="<%= obj.name %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button measure-del" href="#form_measure"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-measure-no" href="#back_measure" data-name="<%= obj.name %>"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);   
        }
    },

    table_dimlinks_template: function(obj) {
        return _.template(
            '<table class="view-options-table">' +
                '<thead>' + 
                    '<tr>' +
                        '<th>List of link dimensions</th>' +
                        '<th>' +
                            '<a class="action show-dimlink-add" href="#show_dimlink_form" data-action="cad"><i class="fa fa-plus-square fa-lg"></i></a>' +
                        '</th>' +
                    '</tr>' +
                '</thead>' + 
                '<tbody class="view-dimlinks"></tbody>' + 
            '</table>' +
            '<form class="form-group">' +
                '<div class="form-buttons">' +
                    '<a class="form_button button-tabs" href="#button_easytabs" data-tab="2">&nbsp;&laquo; Back&nbsp;</a>' +
                    '<a class="form_button measure-group-add" href="#form_measure_group"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                    '<a class="form_button measure-group-cancel" href="#cancel_measure_group"><i class="fa fa-close"></i>&nbsp;Cancel&nbsp;</a>' +
                '</div>' +
            '</form>'
        )(obj);
    },

    dimlinks_template: function(obj) {
        if (obj.action === 'cad' || obj.action === 'edit') {
            return _.template(
                '<form class="form-group dimlink-template">' +
                    '<label for="dimlink-select-dim">Select Dimension:</label>' +
                    '<select id="dimlink-select-dim"><%= obj.dimensions %></select>' +
                    '<span class="error err-6" hidden>This field is required</span>' +
                    '<label for="dimlink-select-fk">Select Foreign Key:</label>' +
                    '<select id="dimlink-select-fk" <%= obj.factlink %>><%= obj.columns %></select>' +
                    '<span class="error err-7" hidden>This field is required</span>' +
                    '<input type="hidden" id="dimlink-action" value="<%= obj.action %>" data-name="<%= obj.dimension %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button dimlink-back" href="#back_dimlink">&nbsp;&laquo; Back&nbsp;</a>' +
                        '<a class="form_button dimlink-add" href="#form_dimlink"><i class="fa fa-check"></i>&nbsp;<%= obj.action === "cad" ? "Add" : "Update" %>&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);
        }
        else {
            return _.template(
                '<form class="form-group dimlink-template">' +
                    '<label for="dimlink-info">Want to remove the link dimension <strong><%= obj.name %></strong>?</label>' +
                    '<input type="hidden" id="dimlink-name" value="<%= obj.name %>">' +
                    '<input type="hidden" id="dimlink-action" value="<%= obj.action %>" data-name="<%= obj.dimid %>">' +
                    '<div class="form-buttons">' +
                        '<a class="form_button dimlink-del" href="#form_dimlink"><i class="fa fa-check"></i>&nbsp;Yes&nbsp;</a>' +
                        '<a class="form_button show-dimlink-no" href="#back_dimlink" data-name="<%= obj.name %>"><i class="fa fa-close"></i>&nbsp;No&nbsp;</a>' +
                    '</div>' +
                '</form>'
            )(obj);   
        }
    },

    show_dim_attr_form: function(tableName, dimName) {
        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').empty();
        var html = this.dimension_attr_template({ table: tableName, dimension: dimName });
        this.$el.parents('.ui-dialog').find('.view-options').append(html);
    },

    show_dim_form: function(args) {
        if (args.type === 'click') {
            args.preventDefault();
            var $currentTarget = $(args.currentTarget);
            var t1 = $currentTarget.closest('.item').data('dimension');
            var t2 = $currentTarget.data('dimid');
            var $currentTarget = $(args.currentTarget),
                tablePhysicalSchema = $currentTarget.data('table'),
                dimId = $currentTarget.closest('.item').data('dimension') ?
                    $currentTarget.closest('.item').data('dimension') :
                    $currentTarget.data('dimid'),
                action = $currentTarget.data('action') ?
                    $currentTarget.data('action') : 'edit';
        }
        else {
            var dimId = args,
                action = 'edit';
        }


        var objAttr = this.args.mondrianSchema.dimension.get(dimId),
            tableName,
            dimNameEdit,
            selectedAttr,
            type,
            attrs, 
            html;

        if (objAttr !== undefined) {
            var objDim = objAttr.toJSON();

            objAttr = this.args.mondrianSchema.dimension.get(dimId);
            objAttr = objAttr.atb.models[0].attribute;
            attrs = this.option_template({ repoObjects: objAttr.toJSON(), multiple: false });

            tableName = objDim.table;
            type = objDim.type;

            if (objDim.key) {
                var keyColumn = objDim.key;
                dimNameEdit = objDim.name;
                $(attrs).each(function(key, value) {
                    if ($(value).text() === keyColumn) {
                        var option = $(value).attr('selected', 'selected');
                        selectedAttr += $(option).outerHTML();
                    }
                    else {
                        selectedAttr += $(value).outerHTML();
                    }
                });
            }
        }

        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').empty();
        html = this.dimension_template({ 
            tablePhysicalSchema: tablePhysicalSchema,
            table: (tableName ? tableName : objDim.name),
            name: (dimNameEdit ? dimNameEdit : objDim.name),
            dimid: dimId,
            columns: (selectedAttr ? selectedAttr : attrs),
            type: type,
            action: action 
        });        
        this.$el.parents('.ui-dialog').find('.view-options').append(html);
    },

    show_attribute_form: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            dimName = $currentTarget.closest('.item').data('dimension') ?
                $currentTarget.closest('.item').data('dimension') : 
                $currentTarget.data('dimension'),
            attrName = $currentTarget.data('attr-name'),
            type = $currentTarget.closest('.item').data('type'),
            action = $currentTarget.data('attr-action') ?
                $currentTarget.data('attr-action') : 'cad',
            currentSchema = this.args.currentSchema,
            objDatabase = this.args.currentDatabase.schemas.get(currentSchema);

        var objDim = this.args.mondrianSchema.dimension.get(dimName);
        objDim = objDim.toJSON();

        var objTable = objDatabase.tables.get(objDim.table),
            cols = this.option_template({ repoObjects: objTable.columns.toJSON2() }),
            html;

        // If click in edit button
        var isAttr = this.args.mondrianSchema.dimension.get(dimName),
            selectedCols,
            selectedNameCols,
            selectedLevelTypes;
        isAttr = isAttr.atb.models[0].attribute.get(attrName);

        // Populate "Select Level Types"
        var arrLevelTypes = [
                { value: '',              name: '-- Select --' },
                { value: 'Regular',       name: 'Regular' },
                { value: 'TimeYears',     name: 'Time Years' },
                { value: 'TimeHalfYears', name: 'Time Half Years' },
                { value: 'TimeQuarters',  name: 'Time Quarters' },
                { value: 'TimeMonths',    name: 'Time Months' },
                { value: 'TimeWeeks',     name: 'Time Weeks' },
                { value: 'TimeDays',      name: 'Time Days' },
                { value: 'TimeHours',     name: 'Time Hours' },
                { value: 'TimeMinutes',   name: 'Time Minutes' },
                { value: 'TimeSeconds',   name: 'Time Seconds' }
            ],
            levelTypes = this.option_template({ repoObjects: arrLevelTypes, addValue: true });

        if (isAttr) {
            var arrCols = isAttr.key.models[0].column.toJSON(),
                levelType = isAttr.attributes.leveltype,
                i = 0;
            selectedCols = '';
            selectedNameCols = '';
            
            $(cols).each(function(key, value) {
                if (arrCols[i] !== undefined) {
                    if ($(value).text() === arrCols[i].name) {
                        var option = $(value).attr('selected', 'selected');
                        selectedCols += $(option).outerHTML();
                        i++;
                    }
                    else {
                        selectedCols += $(value).outerHTML();
                    }
                }
                else {
                    selectedCols += $(value).outerHTML();
                }
            });

            var arrNameCol = isAttr.namecolumn;

            if (arrNameCol.models.length > 0) {
                arrNameCol = arrNameCol.models[0].column.toJSON();

                if (arrNameCol && !(_.isEmpty(arrNameCol))) {
                    $(cols).each(function(key, value) {
                        if ($(value).val() === arrNameCol[0].name) {
                            var option = $(value).attr('selected', 'selected');
                            selectedNameCols += $(option).outerHTML();
                        }
                        else {
                            selectedNameCols += $(value).outerHTML();
                        }
                    });
                }
            }

            $(levelTypes).each(function(key, value) {
                if ($(value).val() === levelType) {
                    var option = $(value).attr('selected', 'selected');
                    selectedLevelTypes += $(option).outerHTML();
                }
                else {
                    selectedLevelTypes += $(value).outerHTML();
                }
            });
        }

        var hashierarchy = '';
        if(isAttr != undefined && isAttr.get('hashierarchy') == true){
            hashierarchy = 'checked';
        }
        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').empty();
        html = this.attribute_template({ 
            name: attrName, 
            dimension: dimName, 
            columns: (selectedCols ? selectedCols : cols),
            isNameColumn: (selectedNameCols ? true : false),
            nameColumn: (selectedNameCols ? arrNameCol[0].name : ''),
            nameColumns: (selectedNameCols ? selectedNameCols : cols),
            type: type,
            levelTypes: (selectedLevelTypes ? selectedLevelTypes : levelTypes),
            hashierarchy: hashierarchy,
            action: action 
        });
        this.$el.parents('.ui-dialog').find('.view-options').append(html);
    },

    show_hierarchy_form: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            dimName = $currentTarget.closest('.item').data('dimension') ?
                $currentTarget.closest('.item').data('dimension') :
                $currentTarget.data('dimension'),
            hierName = $currentTarget.data('hier-name'),
            type = $currentTarget.closest('.item').data('type'),
            action = $currentTarget.data('hier-action') ? 
                $currentTarget.data('hier-action') : 'cad',
            allMemberName,
            html;

        // If click in edit button
        var isHier = this.args.mondrianSchema.dimension.get(dimName);
        isHier = isHier.hierarchies.models[0].hierarchy.get(hierName);

        if (action === 'edit') {
            var objAttr = this.args.mondrianSchema.dimension.get(dimName);
            objAttr = objAttr.atb.models[0].attribute;
            var attrs = objAttr.toJSON(),
                isLevel = this.args.mondrianSchema.dimension.get(dimName),
                selectedLevels;
            isLevel = isLevel.hierarchies.models[0].hierarchy.get(hierName).levels;

            if (type === 'time' && isLevel.models.length > 0) {
                var len = isLevel.models.length,
                    arrData = [],
                    i;

                for (i = 0; i < len; i++) {
                    if (isLevel.models[i].annotations.models.length > 0) {
                        var levelName = isLevel.models[i].attributes.attribute,
                            annotationName = isLevel.models[i].annotations.models[0].annotation.models[0].attributes.name,
                            annotationRaw = isLevel.models[i].annotations.models[0].annotation.models[0].attributes.raw;

                        arrData.push({
                            id: levelName + '_' + annotationRaw,
                            levelName: levelName,
                            name: annotationName,
                            raw: annotationRaw,
                            action: ''
                        });
                    }
                }

                this.dimensionTimeAction = 'edit';
                this.dataAnnotationsTime = new StaticAnnotationsTimeCollection();
                this.dataAnnotationsTime.add(arrData);
            }
        }
        else {
            this.dimensionTimeAction = 'cad';
            this.dataAnnotationsTime = {};
        }

        if (isHier) {
            hierName = isHier.attributes.name;
            allMemberName = isHier.attributes.allmembername;
            if (isLevel) {
                var arrLevels = isLevel.toJSON(),
                    i = 0;
                selectedLevels = '';

                var arrAttrs = [],
                    auxAttrs = [],
                    lenAttrs = attrs.length,
                    lenLevels = arrLevels.length,
                    aux = 0,
                    i, j, k;

                for (i = 0; i < lenAttrs; i++) {
                    auxAttrs.push({
                        name: attrs[i].name,
                        selected: false
                    });
                }

                for (j = 0; j < lenAttrs; j++) {
                    if (aux < lenLevels) {
                        if ((auxAttrs[j].name === arrLevels[aux].attribute) &&
                            auxAttrs[j].selected === false) {
                            arrAttrs.push({
                                name: auxAttrs[j].name,
                                selected: true
                            });
                            auxAttrs[j].selected = true;
                            j = -1;
                            aux++;
                        }
                    }
                    else {
                        j = lenAttrs;
                    }
                }

                for (k = 0; k < auxAttrs.length; k++) {
                    if (auxAttrs[k].selected === false) {
                        arrAttrs.push(auxAttrs[k]);
                    }
                }

                selectedLevels = this.option_level_template({ repoObjects: arrAttrs });
            }
        }

        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').empty();
        html = this.hierarchy_template({ 
            dimension: dimName, 
            name: hierName, 
            allMemberName: allMemberName,
            type: type,
            action: action 
        });
        this.$el.parents('.ui-dialog').find('.view-options').append(html);

        this.show_level_form(selectedLevels, action);

        this.$el.parents('.ui-dialog').find('#tab-hierarchy').easytabs({
            updateHash: false
        });
    },

    show_level_form: function(selectedLevels, action) {
        var dimName = this.$el.parents('.ui-dialog').find('#hier-dim-name').val(),
        objAttr = this.args.mondrianSchema.dimension.get(dimName);
        objAttr = objAttr.atb.models[0].attribute;
        var attrs = this.option_template({ repoObjects: objAttr.toJSON() }),
            html;

        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-options-level').empty();
        html = this.level_template({ attr: (selectedLevels ? selectedLevels : attrs), dimension: dimName, action: action });
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-options-level').append(html);

        this.$el.parents('.ui-dialog').find('.chosen-select').chosen();
        this.$el.parents('.ui-dialog').find('.chosen-choices').chosenSortable();
    },

    add_event_chosen: function() {
        var type = this.$el.parents('.ui-dialog').find('#hier-dim-name').data('type');

        if (type === 'time') {
            this.$el.parents('.ui-dialog').find('.search-choice-close').bind('click', this.remove_annotation_time);
        }
    },

    remove_annotation_time: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            levelName = $currentTarget.closest('.search-choice').text(),
            type = this.$el.parents('.ui-dialog').find('#hier-dim-name').data('type');
        
        if (type === 'time') {
            if (this.dataAnnotationsTime && !(_.isEmpty(this.dataAnnotationsTime))) {
                var objDataAnnotationsTime = this.dataAnnotationsTime.toJSON(),
                    len = objDataAnnotationsTime.length,
                    annotationRaw,
                    i;

                for (i = 0; i < len; i++) {
                    if (objDataAnnotationsTime[i].levelName === levelName) {
                        annotationRaw = objDataAnnotationsTime[i].id;
                        this.dataAnnotationsTime.remove(annotationRaw);
                    }
                }
            }
        }
    },

    show_annotation_time_form: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            levelName = $currentTarget.text(),
            levelNameActionDel = this.$el.parents('.ui-dialog').find('#annotation-time-action').data('level'),
            annotationRaw = $currentTarget.data('annotation'),
            type = this.$el.parents('.ui-dialog').find('#hier-dim-name').data('type'),
            action = $currentTarget.data('action')
                ? $currentTarget.data('action')
                : this.$el.parents('.ui-dialog').find('#hier-action').val(),
            html;

        if (action !== 'del') {
            if (this.dataAnnotationsTime && _.isEmpty(this.dataAnnotationsTime)) {
                if (type === 'time' && action === 'cad') {
                    this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();

                    if (this.dataAnnotationsTime && _.isEmpty(this.dataAnnotationsTime)) {
                        this.dataAnnotationsTime = new StaticAnnotationsTimeCollection();
                    }

                    // Show view options
                    html = this.annotation_time_template({ levelName: levelName, action: action });
                    this.$el.parents('.ui-dialog').find('.view-options').append(html);
                }
            }
            else {
                if (type === 'time' && action === 'edit') {
                    this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();

                    var objDataAnnotationsTime = this.dataAnnotationsTime.toJSON(),
                        len = objDataAnnotationsTime.length,
                        dataAnnotationTime,
                        annotationRaw,
                        i;

                    for (i = 0; i < len; i++) {
                        if (objDataAnnotationsTime[i].levelName === levelName) {
                            annotationRaw = objDataAnnotationsTime[i].id;
                            dataAnnotationTime = this.dataAnnotationsTime.get(annotationRaw);
                        }
                    }

                    if (dataAnnotationTime) {
                        var objDataAnnotationTime = dataAnnotationTime.toJSON();

                        // Show view options
                        html = this.annotation_time_template({
                            levelName: objDataAnnotationTime.levelName ? objDataAnnotationTime.levelName : levelName,
                            annotation: objDataAnnotationTime.raw ? objDataAnnotationTime.raw : '',
                            action: action 
                        });
                        this.$el.parents('.ui-dialog').find('.view-options').append(html);
                    }
                    else {
                        this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();
                        // Show view options
                        html = this.annotation_time_template({ levelName: levelName, action: 'cad' });
                        this.$el.parents('.ui-dialog').find('.view-options').append(html);
                    }
                }
                else {
                    if (this.dataAnnotationsTime.length > 0) {
                        this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();

                        var objDataAnnotationsTime = this.dataAnnotationsTime.toJSON(),
                            len = objDataAnnotationsTime.length,
                            dataAnnotationTime,
                            annotationRaw,
                            i;

                        for (i = 0; i < len; i++) {
                            if (objDataAnnotationsTime[i].levelName === levelName) {
                                annotationRaw = objDataAnnotationsTime[i].id;
                                dataAnnotationTime = this.dataAnnotationsTime.get(annotationRaw);
                            }
                        }

                        if (dataAnnotationTime) {
                            var objDataAnnotationTime = dataAnnotationTime.toJSON();

                            // Show view options
                            html = this.annotation_time_template({
                                levelName: objDataAnnotationTime.levelName ? objDataAnnotationTime.levelName : levelName,
                                annotation: objDataAnnotationTime.raw ? objDataAnnotationTime.raw : '',
                                action: 'edit'
                            });
                            this.$el.parents('.ui-dialog').find('.view-options').append(html);
                        }
                        else {
                            this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();
                            // Show view options
                            html = this.annotation_time_template({ levelName: levelName, action: 'cad' });
                            this.$el.parents('.ui-dialog').find('.view-options').append(html);
                        }
                    }
                    else {
                        this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();
                        // Show view options
                        html = this.annotation_time_template({ levelName: levelName, action: action });
                        this.$el.parents('.ui-dialog').find('.view-options').append(html);
                    }
                }
            }
        }
        else {
            this.$el.parents('.ui-dialog').find('#tab-hierarchy').hide();
            this.$el.parents('.ui-dialog').find('.view-options').find('.annotation-time-template').hide();
            // Show view options
            html = this.annotation_time_template({ levelName: levelNameActionDel, annotation: annotationRaw, action: action });
            this.$el.parents('.ui-dialog').find('.view-options').append(html);
        }
    },

    show_cube_form: function(args) {
        var objCube = this.args.mondrianSchema.cubes.get(cubeName),
            action = 'cad',
            cubeName,
            html;

        if (args) {
            args.preventDefault();
            var $currentTarget = $(args.currentTarget);
            cubeName = $currentTarget.closest('.item').data('cube') ?
                $currentTarget.closest('.item').data('cube') :
                $currentTarget.data('name');
            action = $currentTarget.data('action') ?
                $currentTarget.data('action') : 'edit';
        }

        if (objCube !== undefined) {
            cubeName = objCube.attributes.name;
        }

        var isMeasureGroups = this.args.mondrianSchema.cubes.get(cubeName);

        if (isMeasureGroups) {
            var measureName = isMeasureGroups.attributes.defaultMeasure,
                measureGroups = isMeasureGroups.measuregroups.toJSON(),
                selectedMeasures = '';
            if (measureGroups.length) {
                var lenMeasureGroups = measureGroups.length,
                    arrModelsMeasures = [],
                    arrMeasures,
                    i;

                for (i = 0; i < lenMeasureGroups; i++) {
                    if (measureGroups[i].measures.models.length > 0) {
                        arrModelsMeasures.push(measureGroups[i].measures.models[0].measure.models);
                    }
                }

                arrMeasures = _.flatten(arrModelsMeasures);

                var lenMeasures = arrMeasures.length,
                    measures = [],
                    j;

                for (j = 0; j < lenMeasures; j++) {
                    measures.push({ name: arrMeasures[j].attributes.name });
                }

                measures = tables = this.option_template({ repoObjects: measures, multiple: false });

                if (measureName && !(_.isEmpty(measureName))) {
                    $(measures).each(function(key, value) {
                        if ($(value).text() === measureName) {
                            var option = $(value).attr('selected', 'selected');
                            selectedMeasures += $(option).outerHTML();
                        }
                        else {
                            selectedMeasures += $(value).outerHTML();
                        }
                    });
                }
            }
        }

        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').empty();
        html = this.cube_template({ name: cubeName, measures: (selectedMeasures ? selectedMeasures : measures), action: action });
        this.$el.parents('.ui-dialog').find('.view-options').append(html);
        this.$el.parents('.ui-dialog').find('#cube-name').focus();
    },

    show_measure_group_form: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            cubeName = $currentTarget.closest('.item').data('cube') ?
                $currentTarget.closest('.item').data('cube') :
                $currentTarget.data('cube'),
            objTable = this.args.mondrianSchema.get('physicalschema').tables,
            tables = this.option_template({ repoObjects: objTable.toJSON(), multiple: false }),
            measureGroupName = $currentTarget.closest('.action').data('measure-group-name') ?
                $currentTarget.closest('.action').data('measure-group-name') :
                $currentTarget.data('name'),
            action = $currentTarget.data('action') ? 
                $currentTarget.data('action') : 'cad',
            html;

        // If click in edit button
        var isMeasureGroups = this.args.mondrianSchema.cubes.get(cubeName).measuregroups.get(measureGroupName),
            selectedTables = '';

        if (isMeasureGroups) {
            var tableName = isMeasureGroups.attributes.table;

            if (isMeasureGroups.measures.models.length > 0) {
                var objMeasures = isMeasureGroups.measures.models[0].measure.toJSON();
            }

            var objDimLinksFactLink = isMeasureGroups.dimensionlinks.factlink.toJSON(),
                objDimLinksFkLink = isMeasureGroups.dimensionlinks.foreignkeylink.toJSON();

            this.measureGroupAction = 'edit';

            this.dataMeasures = new StaticMeasuresCollection();
            this.dataDimLinks = new StaticDimLinksCollection();

            this.dataMeasures.add(objMeasures);

            if (objDimLinksFactLink && !(_.isEmpty(objDimLinksFactLink))) {
                this.dataDimLinks.add(objDimLinksFactLink);
            }

            if (objDimLinksFkLink && !(_.isEmpty(objDimLinksFkLink))) {
                this.dataDimLinks.add(objDimLinksFkLink);
            }
            
            measureGroupName = isMeasureGroups.attributes.name;

            $(tables).each(function(key, value) {
                if ($(value).text() === tableName) {
                    var option = $(value).attr('selected', 'selected');
                    selectedTables += $(option).outerHTML();
                }
                else {
                    selectedTables += $(value).outerHTML();
                }
            });
        }
        else {
            this.measureGroupAction = 'cad';
            this.dataMeasures = {};
            this.dataDimLinks = {};
        }

        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').empty();
        html = this.measure_group_template({ cube: cubeName, measureGroupName: measureGroupName, table: (selectedTables ? selectedTables : tables), action: action });
        this.$el.parents('.ui-dialog').find('.view-options').append(html);

        this.show_table_measures();
        this.show_table_dimlinks(action);

        this.$el.parents('.ui-dialog').find('#tab-measure').easytabs({
            updateHash: false
        }); 

        if (isMeasureGroups) {
            this.populate_table_measures();
            this.populate_table_dimlinks();
        }
        else {
            this.measureGroupAction = 'cad';
            this.dataMeasures = {};
            this.dataDimLinks = {};
        }
    },

    show_table_measures: function() {
        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-options-measures').empty();
        var html = this.table_measures_template();
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-options-measures').append(html);
    },

    show_measure_form: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            measureName = $currentTarget.data('name'),
            tableName = this.$el.parents('.ui-dialog').find('#measure-group-select-table option:selected').val(),
            action = $currentTarget.data('action');

        if (tableName) {
            var currentSchema = this.args.currentSchema,
                objDatabase = this.args.currentDatabase.schemas.get(currentSchema),
                objTable = objDatabase.tables.get(tableName),
                cols = this.option_template({ repoObjects: objTable.columns.toJSON2(), multiple: false });

            this.$el.parents('.ui-dialog').find('#tab-measure').hide();

            if (action === 'cad') {
                if (this.dataMeasures && _.isEmpty(this.dataMeasures)) {
                    this.dataMeasures = new StaticMeasuresCollection();
                }

                // Show view options
                var html = this.measures_template({ column: cols, action: action });
                this.$el.parents('.ui-dialog').find('.view-options').append(html);
            }
            else if (action === 'edit') {
                var dataMeasure = this.dataMeasures.get(measureName),
                    objMeasure = dataMeasure.toJSON(),
                    selectedCols = '';

                // Populate "Select Column"
                $(cols).each(function(key, value) {
                    if ($(value).text() === objMeasure.column) {
                        var option = $(value).attr('selected', 'selected');
                        selectedCols += $(option).outerHTML();
                    }
                    else {
                        selectedCols += $(value).outerHTML();
                    }
                });

                // Populate "Select Aggregation"
                var arrAgg = [
                        { value: '',        name: '-- Select --' },
                        { value: 'sum',     name: 'Sum' }, 
                        { value: 'count',   name: 'Count' }, 
                        { value: 'avg', name: 'Average' },
                        { value: 'max',     name: 'Max' }, 
                        { value: 'min',     name: 'Min' }
                    ],
                    aggs = this.option_template({ repoObjects: arrAgg, addValue: true }),
                    selectedAggs = '';

                $(aggs).each(function(key, value) {
                    if ($(value).val() === objMeasure.aggregator) {
                        var option = $(value).attr('selected', 'selected');
                        selectedAggs += $(option).outerHTML();
                    }
                    else {
                        selectedAggs += $(value).outerHTML();
                    }
                });

                // Show view options
                var html = this.measures_template({ 
                    name: measureName, 
                    column: (selectedCols ? selectedCols : cols), 
                    aggregator: (selectedAggs ? selectedAggs : aggs),
                    formatstring: objMeasure.formatstring,
                    action: action
                });
                this.$el.parents('.ui-dialog').find('.view-options').append(html);
            }
            else {
                // Show view options
                var html = this.measures_template({ name: measureName, action: action });
                this.$el.parents('.ui-dialog').find('.view-options').append(html);    
            }
        }
        else {
            (new AlertModal({ 
                dialog: this, 
                message: '<p>You must select a table.</p>'
            })).render().open();
            $('#tab-measure').easytabs('select', '#tab1');
        }
    },

    show_table_dimlinks: function(action) {
        // Show view options
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-options-dimlinks').empty();
        var html = this.table_dimlinks_template({ action: action });
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-options-dimlinks').append(html);
    },

    checkForeignKey: function(event) {
            var isfactlink = "",
            $currentTarget = $(event.currentTarget),
            objDimensions = this.args.mondrianSchema.dimension,
            dimName = this.$('#dimlink-select-dim').val(),
            tableName = this.$el.parents('.ui-dialog').find('#measure-group-select-table option:selected').val();

        if(objDimensions.get(dimName)!= null && objDimensions.get(dimName).get('table') === tableName){
            isfactlink = "disabled";
            this.$('#dimlink-select-fk').prop('disabled', 'disabled');
        }
        else{
            this.$('#dimlink-select-fk').prop('disabled', false);
        }


    },

    show_dimlink_form: function(event) {
        event.preventDefault();
            var $currentTarget = $(event.currentTarget),
            objDimensions = this.args.mondrianSchema.dimension,
            dimensions = this.option_template({ repoObjects: objDimensions.toJSON(), addId: true, multiple: false }),
            dimName = $currentTarget.data('name'),
            tableName = this.$el.parents('.ui-dialog').find('#measure-group-select-table option:selected').val(),
            action = $currentTarget.data('action');
        var isfactlink = "";
        if(objDimensions.get(dimName)!= null && objDimensions.get(dimName).get('table') === tableName){
            isfactlink = "disabled";
        }

        if (tableName) {
            var currentSchema = this.args.currentSchema,
                objDatabase = this.args.currentDatabase.schemas.get(currentSchema),
                objTable = objDatabase.tables.get(tableName),
                cols = this.option_template({ repoObjects: objTable.columns.toJSON2(), multiple: false });

            this.$el.parents('.ui-dialog').find('#tab-measure').hide();

            if (action === 'cad') {
                if (this.dataDimLinks && _.isEmpty(this.dataDimLinks)) {
                    this.dataDimLinks = new StaticDimLinksCollection();
                }

                // Show view options
                var html = this.dimlinks_template({ dimensions: dimensions, columns: cols, action: action, factlink: isfactlink });
                this.$el.parents('.ui-dialog').find('.view-options').append(html);
            }
            else if (action === 'edit') {
                var dataDimLink = this.dataDimLinks.get(dimName),
                    objDimLink = dataDimLink.toJSON(),
                    selectedDims = '',
                    selectedFkCols= '';

                // Populate "Select Dimension"
                $(dimensions).each(function(key, value) {
                    var t = value.value;
                    if (value.value === dimName) {
                        var option = $(value).attr('selected', 'selected');
                        selectedDims += $(option).outerHTML();
                    }
                    else {
                        selectedDims += $(value).outerHTML();
                    }
                });

                // Populate "Select Foreign Key"
                $(cols).each(function(key, value) {
                    if ($(value).text() === objDimLink.foreignkeycolumn) {
                        var option = $(value).attr('selected', 'selected');
                        selectedFkCols += $(option).outerHTML();
                    }
                    else {
                        selectedFkCols += $(value).outerHTML();
                    }
                });

                // Show view options
                var html = this.dimlinks_template({ 
                    dimensions: (selectedDims ? selectedDims : dimensions), 
                    dimension: dimName, 
                    columns: (selectedFkCols ? selectedFkCols : cols), 
                    action: action,
                    factlink: isfactlink
                });
                this.$el.parents('.ui-dialog').find('.view-options').append(html);
            }
            else {
                // Show view options
                var html = this.dimlinks_template({ dimid: dimName, name: objDimensions.get(dimName).get("name"), action: action });
                this.$el.parents('.ui-dialog').find('.view-options').append(html);
            }
        }
        else {
            (new AlertModal({ 
                dialog: this, 
                message: '<p>You must select a table.</p>'
            })).render().open();
            $('#tab-measure').easytabs('select', '#tab1');
        }
    },

    remove_validation: function(event) {
        var $currentTarget = $(event.currentTarget);

        switch ($currentTarget.attr('id')) {
        case 'dim-name':
        case 'attr-name':
        case 'hier-name':
        case 'cube-name':
        case 'measure-group-name':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-1').hide();
            break;

        case 'dim-select-key':
        case 'attr-key-column':
        case 'hier-all-member-name':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-2').hide();
            break;

        case 'attr-level-type':
        case 'measure-name':
        case 'annotation-time-raw':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-3').hide();
            break;

        case 'measure-select-col':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-4').hide();
            break;

        case 'measure-select-agg':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-5').hide();
            break;

        case 'dimlink-select-dim':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-6').hide();
            this.checkForeignKey(event);
            break;

        case 'dimlink-select-fk':
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-7').hide();
            break;

        default:
            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .error').hide();
        }      
    },

    cancel_attribute: function(event) {
        if (event) { event.preventDefault(); }
        this.$el.parents('.ui-dialog').find('.view-options').find('#attr-name').val('');
        this.$el.parents('.ui-dialog').find('.view-options').find('#attr-key-column option:selected').removeAttr('selected');
        this.$el.parents('.ui-dialog').find('.view-options').find('#attr-name-column option:selected').removeAttr('selected');
        this.$el.parents('.ui-dialog').find('.view-options').find('.group-attr-name-column').hide();
        this.$el.parents('.ui-dialog').find('.view-options').find('#attr-level-type option:selected').removeAttr('selected');
        this.$el.parents('.ui-dialog').find('.view-options').find('#attr-action').val('cad');
        this.$el.parents('.ui-dialog').find('.view-options').find('.attr-add').html('<i class="fa fa-check"></i>&nbsp;Add&nbsp;');
        this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .error').hide();
    },

    cancel_hierarchy: function(event) {
        if (event) { event.preventDefault(); }
        $('#tab-hierarchy').easytabs('select', '#tab1');
        this.$el.parents('.ui-dialog').find('.view-options').find('#hier-name').val('');
        this.$el.parents('.ui-dialog').find('.view-options').find('#hier-all-member-name').val('');
        this.$el.parents('.ui-dialog').find('.view-options').find('#level-select option:selected').removeAttr('selected');
        this.$el.parents('.ui-dialog').find('.view-options').find('.chosen-select').val('').trigger('chosen:updated');
        this.$el.parents('.ui-dialog').find('.view-options').find('#hier-action').val('cad');
        this.$el.parents('.ui-dialog').find('.view-options').find('.hier-add').html('<i class="fa fa-check"></i>&nbsp;Add&nbsp;');
        this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .error').hide();
    },

    cancel_cube: function(event) {
        if (event) { event.preventDefault(); }
        this.$el.parents('.ui-dialog').find('.view-options').find('#cube-name').val('');
        this.$el.parents('.ui-dialog').find('.view-options').find('#cube-measures').empty();
        this.$el.parents('.ui-dialog').find('.view-options').find('#cube-action').val('cad');
        this.$el.parents('.ui-dialog').find('.view-options').find('.cube-add').html('<i class="fa fa-check"></i>&nbsp;Add&nbsp;');
        this.$el.parents('.ui-dialog').find('.view-options').find('.show-cube-del').hide();
        this.$el.parents('.ui-dialog').find('.view-options').find('.cube-cancel').show();
        this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .err-1').hide();
    },

    cancel_measure_group: function(event) {
        if (event) { event.preventDefault(); }
        $('#tab-measure').easytabs('select', '#tab1');
        this.$el.parents('.ui-dialog').find('.view-options').find('#measure-group-name').val('');
        this.$el.parents('.ui-dialog').find('.view-options').find('#measure-group-select-table option:selected').removeAttr('selected');
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-measures').empty();
        this.$el.parents('.ui-dialog').find('.view-options').find('.view-dimlinks').empty();
        this.measureGroupAction = 'cad';
        this.dataMeasures = {};
        this.dataDimLinks = {};
        this.$el.parents('.ui-dialog').find('.view-options').find('#measure-group-action').val('cad');
        this.$el.parents('.ui-dialog').find('.view-options').find('.measure-group-add').html('<i class="fa fa-check"></i>&nbsp;Add&nbsp;');
        this.$el.parents('.ui-dialog').find('.view-options').find('.form-group .error').hide();
    },

    back_annotation_time: function(event) {
        if (event) { event.preventDefault(); }
        $('#tab-measure').easytabs('select', '#tab1');
        this.$el.parents('.ui-dialog').find('.view-options').find('#tab-hierarchy').show();
        this.$el.parents('.ui-dialog').find('.view-options').find('.annotation-time-template').remove();
        this.$el.parents('.ui-dialog').find('.view-options').find('.annotation-time-del-template').remove();
    },

    back_annotation_time_del: function(event) {
        if (event) { event.preventDefault(); }
        this.$el.parents('.ui-dialog').find('.view-options').find('.annotation-time-template').show();
        this.$el.parents('.ui-dialog').find('.view-options').find('.annotation-time-del-template').remove();
    },


    back_measure: function(event) {
        if (event) { event.preventDefault(); }
        this.$el.parents('.ui-dialog').find('.view-options').find('#tab-measure').show();
        this.$el.parents('.ui-dialog').find('.view-options').find('.measure-template').remove();
        this.populate_table_measures();
    },

    back_dimlink: function(event) {
        if (event) { event.preventDefault(); }
        this.$el.parents('.ui-dialog').find('.view-options').find('#tab-measure').show();
        this.$el.parents('.ui-dialog').find('.view-options').find('.dimlink-template').remove();
        this.populate_table_dimlinks();
    },

    populate_table_measures: function() {
        var objMeasures = this.dataMeasures.toJSON(),
            len = objMeasures.length,
            i;

        this.$el.parents('.ui-dialog').find('.view-options').find('.view-measures').empty();

        if (objMeasures && !(_.isEmpty(objMeasures))) {
            for (i = 0; i < len; i++) {
                if (objMeasures[i].action) {
                    if (objMeasures[i].action !== 'del') {
                        var html = '<tr class="sub-item" data-name="' + objMeasures[i].name + '">' +
                                       '<td>' + objMeasures[i].name + '</td>' +
                                       '<td>' +
                                           '<a class="action fa-lg show-measure-del" href="#show_measure_form" data-name="' + objMeasures[i].name + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                           '<a class="action fa-lg show-measure-edit" href="#show_measure_form" data-name="' + objMeasures[i].name + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                                       '</td>' +
                                   '</tr>';

                        this.$el.parents('.ui-dialog').find('.view-options').find('.view-measures').append(html);
                    }
                }
                else {
                    var html = '<tr class="sub-item" data-name="' + objMeasures[i].name + '">' +
                                   '<td>' + objMeasures[i].name + '</td>' +
                                   '<td>' +
                                       '<a class="action fa-lg show-measure-del" href="#show_measure_form" data-name="' + objMeasures[i].name + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                       '<a class="action fa-lg show-measure-edit" href="#show_measure_form" data-name="' + objMeasures[i].name + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                                   '</td>' +
                               '</tr>';

                    this.$el.parents('.ui-dialog').find('.view-options').find('.view-measures').append(html);
                }
            }
        }
    },

    populate_table_dimlinks: function() {
        var objDimLinks = this.dataDimLinks.toJSON(),
            len = objDimLinks.length,
            i;

        this.$el.parents('.ui-dialog').find('.view-options').find('.view-dimlinks').empty();

        if (objDimLinks && !(_.isEmpty(objDimLinks))) {
            for (i = 0; i < len; i++) {
                if (objDimLinks[i].action) {
                    if (objDimLinks[i].action !== 'del') {
                        var html = '<tr class="sub-item" data-name="' + objDimLinks[i].dimension + '">' +
                                       '<td>' + objDimLinks[i].dimension + '</td>' +
                                       '<td>' +
                                           '<a class="action fa-lg show-dimlink-del" href="#show_dimlink_form" data-name="' + objDimLinks[i].id + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                           '<a class="action fa-lg show-dimlink-edit" href="#show_dimlink_form" data-name="' + objDimLinks[i].id + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                                       '</td>' +
                                   '</tr>';

                        this.$el.parents('.ui-dialog').find('.view-options').find('.view-dimlinks').append(html);
                    }
                }
                else {
                    var html = '<tr class="sub-item" data-name="' + objDimLinks[i].dimension + '">' +
                                   '<td>' + objDimLinks[i].dimension + '</td>' +
                                   '<td>' +
                                       '<a class="action fa-lg show-dimlink-del" href="#show_dimlink_form" data-name="' + objDimLinks[i].id
                        + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                       '<a class="action fa-lg show-dimlink-edit" href="#show_dimlink_form" data-name="' + objDimLinks[i].id + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                                   '</td>' +
                               '</tr>';

                    this.$el.parents('.ui-dialog').find('.view-options').find('.view-dimlinks').append(html);
                }
            }
        }
    },

    form_dimension_attr: function(event) {
        event.preventDefault();

        var dimName = this.$el.parents('.ui-dialog').find('#dim-attr-name').val(),
        d = this.args.mondrianSchema.dimension.get(dimName),
            currentSchema = this.args.currentSchema,
            objDatabase = this.args.currentDatabase.schemas.get(currentSchema),
            objTable = objDatabase.tables.get(d.get("table")),
            cols = objTable.columns.toJSON2(),
            len = cols.length,
            i;

        for (i = 0; i < len; i++) {
            this.save_attribute(dimName, this.capitalize(cols[i].name), [cols[i].name], { name: this.capitalize(cols[i].name), action: 'cad', notify: false });
        }

        $.notify('Added successfully', { globalPosition: 'top center', className: 'success' });

        this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();

        this.show_dim_form(event);
    },

    form_dimension: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var dimName = this.$el.parents('.ui-dialog').find('#dim-name').val(),
            key = this.$el.parents('.ui-dialog').find('#dim-select-key option:selected').val(),
            type = this.$el.parents('.ui-dialog').find('#dim-select-type option:selected').val(),
            tablePhysicalSchema = this.$el.parents('.ui-dialog').find('#dim-action').data('table'),
            action = this.$el.parents('.ui-dialog').find('#dim-action').val() 
                ? this.$el.parents('.ui-dialog').find('#dim-action').val() 
                : 'edit',
            //cube = this.$el.parents('.ui-dialog').find('#dim-degenerate option:selected')
            isPassed = false;

        if (dimName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('#dim-name').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-1').show();
        }

        if (key) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('.form-group .err-2').show();
        }
        var dimid = this.$el.parents('.ui-dialog').find('#dim-action').data('dimid');
        if (isPassed && (dimName && key)) {
            var dimNameOld = this.$el.parents('.ui-dialog').find('#dim-action').data('name');
            this.save_dimension(null, dimName, key, { type: type, name: dimNameOld, action: action }, null, dimid);
        }

        if (action === 'del') {
            this.save_dimension(null, dimName, null, { tablePhysicalSchema: tablePhysicalSchema, action: action }, null, dimid);
        }
    },

    form_attribute: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var dimName = this.$el.parents('.ui-dialog').find('#attr-dim-name').val(),
            attrNameOld = this.$el.parents('.ui-dialog').find('#attr-action').data('name'),
            attrName = this.$el.parents('.ui-dialog').find('#attr-name').val(),
            keys = this.$el.parents('.ui-dialog').find('#attr-key-column').val(),
            levelType = this.$el.parents('.ui-dialog').find('#attr-level-type option:selected').val(),
            type = this.$el.parents('.ui-dialog').find('#attr-dim-name').data('type'),
            action = this.$el.parents('.ui-dialog').find('#attr-action').val(),
            hashierarchy = this.$el.parents('.ui-dialog').find('#attr-has-hierarchy').is(':checked');
            isPassed = false;

        //if (keys.length > 1) {
            var nameColumnOld,
                nameColumn;

            if (action === 'cad') {
                if(this.$el.parents('.ui-dialog').find('#attr-name-column').is(':visible')) {
                    nameColumn = this.$el.parents('.ui-dialog').find('#attr-name-column').val();
                }
            }
            else if (action === 'edit') {
                if(this.$el.parents('.ui-dialog').find('#attr-name-column').is(':visible')){
                    nameColumn = this.$el.parents('.ui-dialog').find('#attr-name-column').val();
                    nameColumnOld = this.$el.parents('.ui-dialog').find('#attr-action').data('name-column');
                }
            }
        //}

        if (attrName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('#attr-name').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-1').show();
        }

        if (keys) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('.form-group .err-2').show();
        }

        if (type === 'time') {
            if (levelType) {
                isPassed = true;
            }
            else {
                isPassed = false;
                this.$el.parents('.ui-dialog').find('.form-group .err-3').show();   
            }
        }

        if ((type === 'time' && (isPassed && (attrName && keys && levelType))) ||
            (isPassed && (attrName && keys))) {
            if (action === 'cad') {
                this.save_attribute(dimName, attrName, keys, { name: attrName, nameColumn: nameColumn, levelType: levelType, hashierarchy: hashierarchy, action: action });
            }
            else {
                this.save_attribute(dimName, attrName, keys, { name: attrNameOld, nameColumnOld: nameColumnOld, nameColumn: nameColumn, levelType: levelType, hashierarchy: hashierarchy, action: action });
            }
        }
        
        if (action === 'del') {
            this.save_attribute(dimName, attrName, keys, { name: attrNameOld, action: action });
        }
    },

    trigger_attribute_name: function(event) {
        event.preventDefault();

        var keys = this.$el.parents('.ui-dialog').find('#attr-key-column').val();

        if (keys.length > 1) {
            this.$el.parents('.ui-dialog').find('.group-attr-name-column').show();
        }
        else {
            this.$el.parents('.ui-dialog').find('.group-attr-name-column').hide();
        }
    },

    form_hierarchy: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var dimName = this.$el.parents('.ui-dialog').find('#hier-dim-name').val(),
            hierName = this.$el.parents('.ui-dialog').find('#hier-name').val(),
            allMemberName = this.$el.parents('.ui-dialog').find('#hier-all-member-name').val(),
            action = this.$el.parents('.ui-dialog').find('#hier-action').val(),
            levels = [],
            isPassed = false;

        $(this.$el.parents('.ui-dialog').find('.form-group').find('.chosen-container')
            .find('.chosen-choices').find('.search-choice')).each(function(key, value) {
                levels.push($(value).text());
        });

        if (hierName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            $('#tab-hierarchy').easytabs('select', '#tab1');
            this.$el.parents('.ui-dialog').find('#hier-name').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-1').show();
        }

        if (allMemberName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            $('#tab-hierarchy').easytabs('select', '#tab1');
            if (hierName) {
                this.$el.parents('.ui-dialog').find('#hier-all-member-name').focus();
            }
            this.$el.parents('.ui-dialog').find('.form-group .err-2').show();
        }

        if (isPassed && (hierName && allMemberName)) {
            if (action === 'cad') {
                this.save_hierarchy(dimName, hierName, allMemberName, { name: hierName, action: action });
                _.delay(this.save_level, 1000, { 
                    self: this, 
                    dimName: dimName, 
                    hierName: hierName, 
                    levels: levels,
                    action: action
                });
            }
            else {
                var hierNameOld = this.$el.parents('.ui-dialog').find('#hier-action').data('name');
                this.save_hierarchy(dimName, hierName, allMemberName, { name: hierNameOld, action: action });
                _.delay(this.save_level, 1000, { 
                    self: this,
                    dimName: dimName,
                    hierName: hierName,
                    levels: levels,
                    action: action
                });
            }
        }

        if (action === 'del') {
            var hierNameOld = this.$el.parents('.ui-dialog').find('#hier-action').data('name');
            this.save_hierarchy(dimName, hierName, allMemberName, { name: hierNameOld, action: action });
        }
    }, 

    form_annotation_time: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var $currentTarget = $(event.target),
            annotationRaw = this.$el.parents('.ui-dialog').find('#annotation-time-raw').val(),
            annotationRawOld = this.$el.parents('.ui-dialog').find('#annotation-time-action').data('annotation'),
            levelName = this.$el.parents('.ui-dialog').find('#annotation-time-action').data('level'),
            action = $currentTarget.data('action')
                ? $currentTarget.data('action')
                : this.$el.parents('.ui-dialog').find('#annotation-time-action').val(),
            isPassed = false;

        if (annotationRaw) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('#annotation-time-raw').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-3').show();   
        }

        if (isPassed && annotationRaw) {
            if (action === 'cad') {
                this.save_annotation_time(levelName, annotationRaw, { action: action });
            }
            else {
                this.save_annotation_time(levelName, annotationRaw, { annotation: annotationRawOld, action: action });
            }
        }

        if (action === 'del') {
            this.save_annotation_time(levelName, null, { action: action });
        }
    },

    form_annotations_time: function(obj) {
        var self = obj.self,
            dimName = obj.dimName,
            hierName = obj.hierName,
            objAnnotationsTime = obj.annotationsTime;
        self.save_annotations_time(dimName, hierName, objAnnotationsTime, { action: obj.action });
    },

    form_cube: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var cubeName = this.$el.parents('.ui-dialog').find('#cube-name').val(),
            measureName = this.$el.parents('.ui-dialog').find('#cube-measures option:selected').val(),
            action = this.$el.parents('.ui-dialog').find('#cube-action').val(),
            isPassed = false;

        if (cubeName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('#cube-name').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-1').show();
        }

        if (isPassed && cubeName) {
            if (action === 'cad') {
                this.save_cube(cubeName, null, { cubeName: cubeName, action: action });
            }
            else {
                var cubeNameOld = this.$el.parents('.ui-dialog').find('#cube-action').data('name');
                this.save_cube(cubeName, measureName, { cubeName: cubeNameOld, action: action });
            }
            this.cancel_cube();
        }

        if (action === 'del') {
            this.save_cube(cubeName, null, { action: action });
        }
    },

    form_measure_group: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var cubeName = this.$el.parents('.ui-dialog').find('#measure-group-cube-name').val(),
            measureGroupName = this.$el.parents('.ui-dialog').find('#measure-group-name').val(),
            table = this.$el.parents('.ui-dialog').find('#measure-group-select-table').val(),
            action = this.$el.parents('.ui-dialog').find('#measure-group-action').val(),
            isPassed = false;

        if (measureGroupName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            $('#tab-measure').easytabs('select', '#tab1');
            this.$el.parents('.ui-dialog').find('#measure-group-name').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-1').show();
        }
        if (table) {
            isPassed = true;
        }
        else {
            isPassed = false;
            $('#tab-measure').easytabs('select', '#tab1');
            this.$el.parents('.ui-dialog').find('.form-group .err-2').show();   
        }
        
        if (isPassed && (measureGroupName && table)) {
            if (action === 'cad') {
                this.save_measure_group(cubeName, measureGroupName, table, { name: measureGroupName, action: action });

                _.delay(this.form_measures, 1000, {
                    self: this,
                    cubeName: cubeName,
                    measureGroupName: measureGroupName,
                    measures: !(_.isEmpty(this.dataMeasures))
                        ? this.dataMeasures.toJSON() : {},
                    action: action
                });

                _.delay(this.form_dimlinks, 1000, {
                    self: this,
                    cubeName: cubeName,
                    measureGroupName: measureGroupName,
                    dimLinks: !(_.isEmpty(this.dataDimLinks))
                        ? this.dataDimLinks.toJSON() : {},
                    action: action
                });
            }
            else {
                var measureGroupNameOld = this.$el.parents('.ui-dialog').find('#measure-group-action').data('name');

                this.save_measure_group(cubeName, measureGroupName, table, { name: measureGroupNameOld, action: action });

                _.delay(this.form_measures, 1000, {
                    self: this,
                    cubeName: cubeName,
                    measureGroupName: measureGroupName,
                    measures: this.dataMeasures.toJSON(),
                    action: action
                });

                _.delay(this.form_dimlinks, 1000, {
                    self: this,
                    cubeName: cubeName,
                    measureGroupName: measureGroupName,
                    dimLinks: this.dataDimLinks.toJSON(),
                    action: action
                });
            }
        }

        if (action === 'del') {
            var measureGroupNameOld = this.$el.parents('.ui-dialog').find('#measure-group-action').data('name');
            this.save_measure_group(cubeName, measureGroupName, table, { name: measureGroupNameOld, action: action });
        }
    },

    form_measure: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var measureName = this.$el.parents('.ui-dialog').find('#measure-name').val(),
            column = this.$el.parents('.ui-dialog').find('#measure-select-col option:selected').val(),
            agg = this.$el.parents('.ui-dialog').find('#measure-select-agg option:selected').val(),
            formatstring = this.$el.parents('.ui-dialog').find('#measure-formatstring').val(),
            action = this.$el.parents('.ui-dialog').find('#measure-action').val(),
            isPassed = false;

        if (measureName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('#measure-name').focus();
            this.$el.parents('.ui-dialog').find('.form-group .err-3').show();   
        }
        if (column) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('.form-group .err-4').show();   
        }
        if (agg) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('.form-group .err-5').show();   
        }

        if (isPassed && (measureName && column && agg)) {
            if (action === 'cad') {
                this.save_measure(measureName, column, agg, formatstring, { action: action });
            }
            else {
                var measureNameOld = this.$el.parents('.ui-dialog').find('#measure-action').data('name');
                this.save_measure(measureName, column, agg, formatstring, { name: measureNameOld, action: action });
            }
        }

        if (action === 'del') {
            this.save_measure(measureName, null, null, null, { action: action });
        }
    },

    form_measures: function(obj) {
        var self = obj.self,
            cubeName = obj.cubeName,
            measureGroupName = obj.measureGroupName,
            objMeasures = obj.measures;
        self.save_measures(cubeName, measureGroupName, objMeasures, { action: obj.action });
    },

    form_dimlink: function(event) {
        event.preventDefault();

        this.$el.parents('.ui-dialog').find('.form-group .error').hide();

        var dimId = this.$el.parents('.ui-dialog').find('#dimlink-select-dim option:selected').val()?
                this.$el.parents('.ui-dialog').find('#dimlink-select-dim option:selected').val():this.$el.parents('.ui-dialog').find('#dimlink-action').data('name'),
            fkName = this.$el.parents('.ui-dialog').find('#dimlink-select-fk option:selected').val(),
            action = this.$el.parents('.ui-dialog').find('#dimlink-action').val(),
            isPassed = false,
            dimName = this.args.mondrianSchema.dimension.get(dimId).get("name");

        if (dimName) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('.form-group .err-6').show(); 
        }
        if (fkName) {
            isPassed = true;
        }
        else if( this.$el.parents('.ui-dialog').find('#dimlink-select-fk').is(':disabled')){
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.parents('.ui-dialog').find('.form-group .err-7').show(); 
        }

        if (isPassed && (dimName)) {
            if (action === 'cad') {
                this.save_dimlink(dimId, dimName, fkName, { action: action });
            }
            else {
                var dimNameOld = this.$el.parents('.ui-dialog').find('#dimlink-action').data('name');
                this.save_dimlink(dimId, dimName, fkName, { name: dimNameOld, action: action });
            }
        }

        if (action === 'del') {
            var dimNameDel = this.$el.parents('.ui-dialog').find('#dimlink-action').data('name');
            this.save_dimlink(dimId, dimNameDel, null, { action: action });
        }
    },

    form_dimlinks: function(obj) {
        var self = obj.self,
            cubeName = obj.cubeName,
            measureGroupName = obj.measureGroupName,
            objDimLinks = obj.dimLinks;
        self.save_dimlinks(cubeName, measureGroupName, objDimLinks, { action: obj.action });
    },

    remove_attribute: function(dimName) {
        var dim = this.args.mondrianSchema.dimension.get(dimName),
            // attr = dim.atb.models[0].attribute,
            objAttrs = dim.atb.models[0].attribute.toJSON(),
            len = objAttrs.length,
            i;

        if (len > 0) {
            for (i = 0; i < len; i++) {                
                if (objAttrs[i].leveltype !== 'Regular') {
                    // attr.remove(objAttrs[i].name);

                    // // Remove attributes
                    // $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                    //     .find('.view-attr').find('.sub-item')).each(function() {
                    //         if ($(this).data('attr') === objAttrs[i].name) {
                    //             $(this).closest('.sub-item').remove();
                    //         }
                    // });

                    var attr = dim.atb.models[0].attribute.get(objAttrs[i].name);

                    attr.set({
                        leveltype: 'Regular'
                    });
                }
            }
        }
    },

    remove_hierarchy: function(dimName) {
        var dim = this.args.mondrianSchema.dimension.get(dimName),
            hier = dim.hierarchies.models[0].hierarchy,
            objHiers = dim.hierarchies.models[0].hierarchy.toJSON(),
            len = objHiers.length,
            i;

        if (len > 0) {
            for (i = 0; i < len; i++) {
                hier.remove(objHiers[i].name);

                // Remove hierarchies
                $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                    .find('.view-hier').find('.sub-item')).each(function() {
                        if ($(this).data('hier') === objHiers[i].name) {
                            $(this).closest('.sub-item').remove();
                        }
                });
            }
        }
    },
    save_dimension: function(tableName, dimName, key, obj, cube, id) {
        if (obj.action !== 'del') {
            var self = this,
                isDim;

            if (obj.action === 'cad') {
                isDim = this.args.mondrianSchema.dimension.get(id);
            }
            else {
                isDim = this.args.mondrianSchema.dimension.get(id);
            }
            if (isDim === undefined) {
                var dim = this.args.mondrianSchema.dimension;
                dim.add(new MondrianDimensionModel({ 
                    id: id,
                    name: dimName, 
                    table: tableName,
                    type: obj.type,
                    key: key/*,
                    cube: cube*/
                }));

                var attributes = this.args.mondrianSchema.dimension.get(id).atb;
                attributes.add(new MondrianAttributesModel());

                var hierarchies = this.args.mondrianSchema.dimension.get(id).hierarchies;
                hierarchies.add(new MondrianHierarchiesModel());
            }
            else {
                if (obj.type === 'time') {
                    isDim.set({
                        id: id,
                        name: dimName,
                        type: 'TIME',
                        key: key
                    });

                    // Edit data-type
                    $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                        if ($(this).data('dimension') === id) {
                            $(this).data('type', 'time');
                        }
                    });
                }
                else {
                    isDim.set({
                        id: id,
                        name: dimName,
                        type: '',
                        key: key
                    });

                    // Edit data-type
                    $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                        if ($(this).data('dimension') === id) {
                            $(this).data('type', 'standard');
                        }
                    });

                    this.remove_attribute(id);
                }

                this.$el.parents('.ui-dialog').find('.view-options').find('#dim-action').data('name', dimName);
                this.$el.parents('.ui-dialog').find('.view-options').find('#dim-action').data('dimid', id);

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('dimension') === id) {
                        $(this).data('dimension', id);
                        $(this).find('.dimension-name').find('.show-dim-edit').text(dimName);
                    }
                });

                /* TODO
                 * We should check for matching links and update the pointers
                 */
                //this.save_dimlink(id, dimName, null, { action: 'upd', oldName: obj.name});

                $.notify('Updated successfully', { globalPosition: 'top center', className: 'success' });
            }
        }
        else {
            this.args.mondrianSchema.dimension.remove(id);

            // Remove dimension
            $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                if ($(this).data('dimension') === id) {
                    $(this).closest('.item').remove();
                }
            });

            // Show table in "Tables Physical Schema"
            $(this.$el.parents('.ui-dialog').find('.tables-list').find('.table')).each(function() {
                if ($(this).data('table') === obj.tablePhysicalSchema) {
                    $(this).closest('.table').show();
                    $(this).closest('.table').find('.table-toggle').prop('checked', false);
                }
            });

            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();

            $.notify('Deleted successfully', { globalPosition: 'top center', className: 'success' });
        }
    },

    save_attribute: function(dimName, attrName, keys, obj) {
        if (obj.action !== 'del') {
            var isAttr = this.args.mondrianSchema.dimension.get(dimName),
                keyColumn;

            if (obj.action === 'cad') {
                isAttr = isAttr.atb.models[0].attribute.get(attrName);
            }
            else {
                isAttr = isAttr.atb.models[0].attribute.get(obj.name);
            }

            if (isAttr === undefined) {
                var attr = this.args.mondrianSchema.dimension.get(dimName).atb;

                attr.models[0].attribute.add(new MondrianAttributeModel({
                    id: attrName,
                    name: attrName,
                    leveltype: obj.levelType ? obj.levelType : 'Regular',
                    hashierarchy: obj.hashierarchy
                }));

                keyColumn = attr.models[0].attribute.get(attrName).key;

                if (keyColumn.models.length === 0) {
                    keyColumn.add(new MondrianAttributeKeyModel());
                    
                    var column = keyColumn.models[0].column;

                    if (keys && !(_.isEmpty(keys))) {
                        var lenKeys = keys.length,
                            i;

                        for (i = 0; i < lenKeys; i++) {
                            column.add(new MondrianAttributeColumnModel({
                                id: keys[i],
                                name: keys[i]
                            }));
                        }
                    }
                }

                if (obj.nameColumn) {
                    var nameColumn = attr.models[0].attribute.get(attrName).namecolumn;

                    if (nameColumn.models.length === 0) {
                        nameColumn.add(new MondrianAttributeKeyModel());
                        
                        var column = nameColumn.models[0].column;

                        column.add(new MondrianAttributeColumnModel({
                            id: obj.nameColumn,
                            name: obj.nameColumn
                        }));
                    }
                }

                var html = '<tr class="sub-item" data-attr="' + attrName + '">' +
                               '<td>' + attrName + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-attr-del" href="#show_attribute_form" data-attr-name="' + attrName + '" data-attr-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-attr-edit" href="#show_attribute_form" data-attr-name="' + attrName + '" data-attr-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('dimension') === dimName) {
                        $(this).closest('.item').find('.view-attr').append(html);
                    }
                });

                this.cancel_attribute();

                if (obj.notify !== false) {
                    $.notify('Added successfully', { globalPosition: 'top center', className: 'success' });
                }
            }
            else {
                keyColumn = isAttr.key;

                isAttr.set({
                    id: attrName,
                    name: attrName,
                    leveltype: obj.levelType ? obj.levelType : 'Regular',
                    hashierarchy: obj.hashierarchy
                });
    
                var column = keyColumn.models[0].column,
                    objColumn = keyColumn.models[0].column.toJSON(),
                    lenColumn = keyColumn.models[0].column.length,
                    i;

                if (objColumn && !(_.isEmpty(objColumn))) {
                    for (i = 0; i < lenColumn; i++) {
                        column.remove(objColumn[i].name);
                    }
                }

                if (keys && !(_.isEmpty(keys))) {
                    var lenKeys = keys.length,
                        j;

                    for (j = 0; j < lenKeys; j++) {
                        column.add(new MondrianAttributeColumnModel({
                            id: keys[j],
                            name: keys[j]
                        }));
                    }
                }

                if (_.isEmpty(obj.nameColumnOld) && obj.nameColumn) {
                    var nameColumn = isAttr.namecolumn;

                    if (nameColumn.models.length === 0) {
                        nameColumn.add(new MondrianAttributeKeyModel());
                        
                        var column = nameColumn.models[0].column;

                        column.add(new MondrianAttributeColumnModel({
                            id: obj.nameColumn,
                            name: obj.nameColumn
                        }));
                    }
                    else {
                        var column = nameColumn.models[0].column;

                        column.add(new MondrianAttributeColumnModel({
                            id: obj.nameColumn,
                            name: obj.nameColumn
                        }));
                    }
                }
                else if (obj.nameColumnOld && obj.nameColumn) {
                    var nameColumn = isAttr.namecolumn,
                        column = nameColumn.models[0].column.get(obj.nameColumnOld);

                    column.set({
                        id: obj.nameColumn,
                        name: obj.nameColumn
                    });
                }
                else {
                    var nameColumn = isAttr.namecolumn;

                    if (nameColumn.models.length > 0) {                        
                        var objNameColumn = nameColumn.models[0].column.toJSON(),
                            column = nameColumn.models[0].column;

                        column.remove(objNameColumn[0].name);
                    }   
                }

                // Checks whether the attribute `key` that 
                // are editing exists in the dimension model
                this.check_dimension_key(dimName, obj.name, attrName);

                // Remove edited attribute
                $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                    .find('.view-attr').find('.sub-item')).each(function() {
                        if ($(this).data('attr') === obj.name) {
                            $(this).closest('.sub-item').remove();
                        }
                });

                var html = '<tr class="sub-item" data-attr="' + attrName + '">' +
                               '<td>' + attrName + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-attr-del" href="#show_attribute_form" data-attr-name="' + attrName + '" data-attr-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-attr-edit" href="#show_attribute_form" data-attr-name="' + attrName + '" data-attr-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('dimension') === dimName) {
                        $(this).closest('.item').find('.view-attr').append(html);
                    }
                });

                this.cancel_attribute();

                $.notify('Updated successfully', { globalPosition: 'top center', className: 'success' });
            }
        }
        else {
            var isAttr = this.args.mondrianSchema.dimension.get(dimName);
            isAttr.atb.models[0].attribute.remove(obj.name);

            // Remove attribute
            $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                .find('.view-attr').find('.sub-item')).each(function() {
                    if ($(this).data('attr') === obj.name) {
                        $(this).closest('.sub-item').remove();
                    }
            });

            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();

            $.notify('Deleted successfully', { globalPosition: 'top center', className: 'success' });
        }
    },

    save_hierarchy: function(dimName, hierName, allMemberName, obj) {
        if (obj.action !== 'del') {
            var isHier = this.args.mondrianSchema.dimension.get(dimName);

            if (obj.action === 'cad') {
                isHier = isHier.hierarchies.models[0].hierarchy.get(hierName);
            }
            else {
                isHier = isHier.hierarchies.models[0].hierarchy.get(obj.name);
            }

            if (isHier === undefined) {
                var hier = this.args.mondrianSchema.dimension.get(dimName).hierarchies;
                
                hier.models[0].hierarchy.add(new MondrianHierarchyModel({
                    id: hierName,
                    name: hierName,
                    allmembername: allMemberName
                }));

                var html = '<tr class="sub-item" data-hier="' + hierName + '">' +
                               '<td>' + hierName + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-hier-del" href="#show_hierarchy_form" data-hier-name="' + hierName + '" data-hier-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-hier-edit" href="#show_hierarchy_form" data-hier-name="' + hierName + '" data-hier-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('dimension') === dimName) {
                        $(this).closest('.item').find('.view-hier').append(html);
                    }
                });

                this.cancel_hierarchy();

                $.notify('Added successfully', { globalPosition: 'top center', className: 'success' });
            }
            else {
                isHier.set({
                    id: hierName,
                    name: hierName,
                    allmembername: allMemberName
                });

                // Remove edited attribute
                $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                    .find('.view-hier').find('.sub-item')).each(function() {
                        if ($(this).data('hier') === obj.name) {
                            $(this).closest('.sub-item').remove();
                        }
                });

                var html = '<tr class="sub-item" data-hier="' + hierName + '">' +
                               '<td>' + hierName + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-hier-del" href="#show_hierarchy_form" data-hier-name="' + hierName + '" data-hier-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-hier-edit" href="#show_hierarchy_form" data-hier-name="' + hierName + '" data-hier-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('dimension') === dimName) {
                        $(this).closest('.item').find('.view-hier').append(html);
                    }
                });

                this.cancel_hierarchy();

                $.notify('Updated successfully', { globalPosition: 'top center', className: 'success' });
            }
        }
        else {
            var isHier = this.args.mondrianSchema.dimension.get(dimName);
            isHier.hierarchies.models[0].hierarchy.remove(obj.name);

            // Remove hierarchy
            $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                .find('.view-hier').find('.sub-item')).each(function() {
                    if ($(this).data('hier') === obj.name) {
                        $(this).closest('.sub-item').remove();
                    }
            });

            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();

            $.notify('Deleted successfully', { globalPosition: 'top center', className: 'success' });
        }
    },

    save_level: function(obj) {
        var self = obj.self,
            level = self.args.mondrianSchema.dimension.get(obj.dimName);
        level = level.hierarchies.models[0].hierarchy.get(obj.hierName).levels;

        if (obj.levels !== null) {
            if (level.models.length === 0) {
                var lenLevels = obj.levels.length,
                    i;

                for (i = 0; i < lenLevels; i++) {
                    level.add(new MondrianLevelModel({
                        id: obj.levels[i],
                        attribute: obj.levels[i]
                    }));
                }
            }
            else {
                var objAttr = level.toJSON(),
                    lenAttr = objAttr.length,
                    i;

                if (objAttr && !(_.isEmpty(objAttr))) {
                    for (i = 0; i < lenAttr; i++) {
                        level.remove(objAttr[i].attribute);
                    }
                }

                if (obj.levels && !(_.isEmpty(obj.levels))) {
                    var lenLevels = obj.levels.length,
                        i;

                    for (i = 0; i < lenLevels; i++) {
                        level.add(new MondrianLevelModel({
                            id: obj.levels[i],
                            attribute: obj.levels[i]
                        }));
                    }
                }
            }
        }

        if (obj.action === 'cad') {
            self.form_annotations_time({
                self: self,
                dimName: obj.dimName, 
                hierName: obj.hierName,
                annotationsTime: !(_.isEmpty(self.dataAnnotationsTime))
                    ? self.dataAnnotationsTime.toJSON() : {},
                action: obj.action
            });
        }
        else if (obj.action === 'edit') {
            self.form_annotations_time({
                self: self,
                dimName: obj.dimName, 
                hierName: obj.hierName,
                annotationsTime: !(_.isEmpty(self.dataAnnotationsTime))
                    ? self.dataAnnotationsTime.toJSON() : {},
                action: obj.action
            });
        }
    },

    save_annotation_time: function(levelName, annotationRaw, obj) {
        if (obj.action !== 'del') {
            if (obj.action === 'cad') {
                this.dataAnnotationsTime.add(new StaticAnnotationTimeModel({
                    id: levelName + '_' + annotationRaw,
                    name: 'AnalyzerDateFormat',
                    raw: annotationRaw,
                    levelName: levelName,
                    action: 'cad'
                }));
            }
            else {
                var annotationTime = this.dataAnnotationsTime.get(obj.annotation),
                    objAnnotation = annotationTime.toJSON();

                if (this.dimensionTimeAction === 'cad') {
                    annotationTime.set({
                        id: levelName + '_' + annotationRaw,
                        name: 'AnalyzerDateFormat',
                        raw: annotationRaw,
                        levelName: levelName,
                        action: 'cad'
                    });                   
                }
                else {
                    if (objAnnotation.flag) {
                        annotationTime.set({
                            id: levelName + '_' + annotationRaw,
                            name: 'AnalyzerDateFormat',
                            oldRaw: obj.annotation,
                            raw: annotationRaw,
                            levelName: levelName,
                            action: 'edit',
                            flag: true
                        });
                    }
                    else if (objAnnotation.action === 'cad') {
                        annotationTime.set({
                            id: levelName + '_' + annotationRaw,
                            name: 'AnalyzerDateFormat',
                            raw: annotationRaw,
                            levelName: levelName,
                            action: 'cad'
                        });
                    }
                    else {
                        annotationTime.set({
                            id: levelName + '_' + annotationRaw,
                            name: 'AnalyzerDateFormat',
                            oldRaw: obj.annotation,
                            raw: annotationRaw,
                            levelName: levelName,
                            action: 'edit',
                            flag: true
                        });   
                    }
                }
            }
        }
        else {
            var objDataAnnotationsTime = this.dataAnnotationsTime.toJSON(),
                len = objDataAnnotationsTime.length,
                annotationRaw,
                i;

            for (i = 0; i < len; i++) {
                if (objDataAnnotationsTime[i].levelName === levelName) {
                    annotationRaw = objDataAnnotationsTime[i].id;
                    this.dataAnnotationsTime.remove(annotationRaw);
                }
            }
        }

        this.back_annotation_time();
    },

    save_annotations_time: function(dimName, hierName, objAnnotationsTime, obj) {
        var objDim = this.args.mondrianSchema.dimension.get(dimName),
            objHier = objDim.hierarchies.models[0].hierarchy.get(hierName),
            objLevel,
            annotationsTime;

        if (obj.action !== 'del') {
            var len = objAnnotationsTime.length,
                i;

            for (i = 0; i < len; i++) {
                objLevel = objHier.levels.get(objAnnotationsTime[i].levelName);
                if (objLevel && !(_.isEmpty(objLevel))) {
                    annotationsTime = objLevel.annotations;

                    annotationsTime.add(new MondrianAnnotationsModel());

                    var annotationTime = annotationsTime.models[0].annotation;

                    annotationTime.add(new MondrianAnnotationModel({
                        id: objAnnotationsTime[i].levelName + '_' + objAnnotationsTime[i].raw,
                        name: objAnnotationsTime[i].name,
                        raw: objAnnotationsTime[i].raw
                    }));
                }
            }
        }
    },

    save_cube: function(cubeName, measureName, obj) {
        if (obj.action !== 'del') {
            var cube;

            if (obj.action === 'cad') {
                cube = this.args.mondrianSchema.cubes;
                cube.add(new MondrianCubeModel({ 
                    id: cubeName, 
                    name: cubeName 
                }));

                var element = $(
                    '<li class="item" data-cube="' + cubeName + '">' +
                        '<input type="checkbox" name="accordion-radio">' +
                        '<strong class="cube-name">Cube: <a class="show-cube-edit" href="#show_cube_form" data-action="edit">' + cubeName + '</a></strong>' +
                        '<div>' +
                            '<table class="table-items">' +
                                '<thead>' + 
                                    '<tr>' +
                                        '<th>Measure Groups</th>' +
                                        '<th>' +
                                            '<a class="action show-measure-group" href="#add_attr"><i class="fa fa-plus-square fa-lg"></i></a>' +
                                        '</th>' +
                                    '</tr>' +
                                '</thead>' + 
                                '<tbody class="view-measure-groups">' + 
                                '</tbody>' + 
                            '</table>' +
                        '</div>' +
                    '</li>'
                );

                this.$el.parents('.ui-dialog').find('.list-items').append(element);

                if (obj.notify !== false) {
                    $.notify('Added successfully', { globalPosition: 'top center', className: 'success' });
                }
            }
            else {
                cube = this.args.mondrianSchema.cubes.get(obj.cubeName);
                cube.set({
                    id: cubeName, 
                    name: cubeName,
                    defaultMeasure: measureName
                });

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('cube') === obj.cubeName) {
                        $(this).data('cube', cubeName);
                        $(this).find('.cube-name').find('.show-cube-edit').text(cubeName);
                    }
                });

                $.notify('Updated successfully', { globalPosition: 'top center', className: 'success' });
            }
        }
        else {
            this.args.mondrianSchema.cubes.remove(cubeName);

            // Remove cube
            $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                if ($(this).data('cube') === cubeName) {
                    $(this).closest('.item').remove();
                }
            });

            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();

            $.notify('Deleted successfully', { globalPosition: 'top center', className: 'success' });
        }
    },

    save_measure_group: function(cubeName, measureGroupName, table, obj) {
        if (obj.action !== 'del') {
            var isMeasureGroups;

            if (obj.action === 'cad') {
                isMeasureGroups = this.args.mondrianSchema.cubes.get(cubeName).measuregroups.get(measureGroupName);
            }
            else {
                isMeasureGroups = this.args.mondrianSchema.cubes.get(cubeName).measuregroups.get(obj.name);
            }
            
            if (isMeasureGroups === undefined) {
                var measureGroups = this.args.mondrianSchema.cubes.get(cubeName).measuregroups;
                measureGroups.add(new MondrianMeasureGroupModel({
                    id: measureGroupName,
                    name: measureGroupName,
                    table: table
                }));

                var html = '<tr class="sub-item" data-measure-group="' + measureGroupName + '">' +
                               '<td>' + measureGroupName + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-measure-group-del" href="#" data-measure-group-name="' + measureGroupName + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-measure-group-edit" href="#" data-measure-group-name="' + measureGroupName + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('cube') === cubeName) {
                        $(this).closest('.item').find('.view-measure-groups').append(html);
                    }
                });

                if (obj.notify !== false) {
                    $.notify('Added successfully', { globalPosition: 'top center', className: 'success' });
                }
            }
            else {
                isMeasureGroups.set({
                    id: measureGroupName,
                    name: measureGroupName,
                    table: table
                });

                // Remove edited measure
                $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                    .find('.view-measure-groups').find('.sub-item')).each(function() {
                        if ($(this).data('measure-group') === obj.name) {
                            $(this).closest('.sub-item').remove();
                        }
                });

                var html = '<tr class="sub-item" data-measure-group="' + measureGroupName + '">' +
                               '<td>' + measureGroupName + '</td>' +
                               '<td>' +
                                   '<a class="action fa-lg show-measure-group-del" href="#" data-measure-group-name="' + measureGroupName + '" data-action="del"><i class="fa fa-trash"></i></a>' +
                                   '<a class="action fa-lg show-measure-group-edit" href="#" data-measure-group-name="' + measureGroupName + '" data-action="edit"><i class="fa fa-edit"></i></a>' +
                               '</td>' +
                           '</tr>';

                $(this.$el.parents('.ui-dialog').find('.list-items').find('.item')).each(function() {
                    if ($(this).data('cube') === cubeName) {
                        $(this).closest('.item').find('.view-measure-groups').append(html);
                    }
                });

                $.notify('Updated successfully', { globalPosition: 'top center', className: 'success' });
            }
        }
        else {
            this.args.mondrianSchema.cubes.get(cubeName).measuregroups.remove(obj.name);

            // Remove measure
            $(this.$el.parents('.ui-dialog').find('.list-items').find('.table-items')
                .find('.view-measure-groups').find('.sub-item')).each(function() {
                    if ($(this).data('measure-group') === obj.name) {
                        $(this).closest('.sub-item').remove();
                    }
            });

            this.$el.parents('.ui-dialog').find('.view-options').find('.form-group').remove();

            $.notify('Deleted successfully', { globalPosition: 'top center', className: 'success' });
        }
    },

    save_measure: function(measureName, column, agg, formatstring, obj) {
        if (obj.action !== 'del') {
            if (obj.action === 'cad') {
                this.dataMeasures.add(new StaticMeasureModel({
                    id: measureName,
                    name: measureName,
                    column: column,
                    aggregator: agg,
                    formatstring: formatstring,
                    action: 'cad'
                }));
            }
            else {
                var measure = this.dataMeasures.get(obj.name),
                    objMeasure = measure.toJSON();

                if (this.measureGroupAction === 'cad') {
                    measure.set({
                        id: measureName,
                        name: measureName,
                        column: column,
                        aggregator: agg,
                        formatstring: formatstring,
                        action: 'cad'
                    });
                }
                else {
                    if (objMeasure.flag) {
                        measure.set({
                            id: measureName,
                            oldName: obj.name,
                            name: measureName,
                            column: column,
                            aggregator: agg,
                            formatstring: formatstring,
                            action: 'edit',
                            flag: true
                        });
                    }
                    else if (objMeasure.action === 'cad') {
                        measure.set({
                            id: measureName,
                            name: measureName,
                            column: column,
                            aggregator: agg,
                            formatstring: formatstring,
                            action: 'cad'
                        });   
                    }
                    else {
                        measure.set({
                            id: measureName,
                            oldName: obj.name,
                            name: measureName,
                            column: column,
                            aggregator: agg,
                            formatstring: formatstring,
                            action: 'edit',
                            flag: true
                        });
                    }
                }
            }
        }
        else {
            if (this.measureGroupAction === 'cad') {
                this.dataMeasures.remove(measureName);
            }
            else {
                var measure = this.dataMeasures.get(measureName),
                    objMeasure = measure.toJSON();

                if (objMeasure.action === 'edit') {
                    measure.set({
                        id: _.uniqueId(measureName + '_'),
                        action: 'del'
                    });
                }
                else if (objMeasure.action === 'cad') {
                    this.dataMeasures.remove(measureName);
                }
                else {
                    measure.set({
                        id: _.uniqueId(measureName + '_'),
                        action: 'del'
                    });   
                }
            }
        }

        this.back_measure();
    },

    save_measures: function(cubeName, measureGroupName, objMeasures, obj) {
        var measures = this.args.mondrianSchema.cubes.get(cubeName).measuregroups.get(measureGroupName).measures;

        if (obj.action === 'cad') {
            measures.add(new MondrianMeasureModel());

            var measure = measures.models[0].measure,
                len = objMeasures.length,
                i;

            for (i = 0; i < len; i++) {
                measure.add(new MondrianMeasuresMeasureModel({
                    id: objMeasures[i].name,
                    name: objMeasures[i].name,
                    column: objMeasures[i].column,
                    aggregator: objMeasures[i].aggregator,
                    formatstring: objMeasures[i].formatstring
                }));
            }
        }
        else {
            var len = objMeasures.length,
                measure,
                i;

            if (measures.models.length > 0) {
                var measure = measures.models[0].measure;
            }
            else {
                measures.add(new MondrianMeasureModel());
                var measure = measures.models[0].measure;
            }

            for (i = 0; i < len; i++) {
                if (objMeasures[i].action === 'cad') {
                    measure.add(new MondrianMeasuresMeasureModel({
                        id: objMeasures[i].name,
                        name: objMeasures[i].name,
                        column: objMeasures[i].column,
                        aggregator: objMeasures[i].aggregator,
                        formatstring: objMeasures[i].formatstring
                    }));
                }
                else if (objMeasures[i].action === 'edit') {
                    var measureEdit = measures.models[0].measure.get(objMeasures[i].oldName);

                    measureEdit.set({
                        id: objMeasures[i].name,
                        name: objMeasures[i].name,
                        column: objMeasures[i].column,
                        aggregator: objMeasures[i].aggregator,
                        formatstring: objMeasures[i].formatstring
                    });
                }
                else if (objMeasures[i].action === 'del') {
                    var measureName = objMeasures[i].name;
                    measure.remove(measureName);
                }
            }
        }
    },

    save_dimlink: function(dimId, dimName, fkName, obj) {
        if (obj.action !== 'del') {
            if (obj.action === 'cad') {
                this.dataDimLinks.add(new StaticDimLinkModel({
                    id: dimId,
                    dimension: dimName,
                    foreignkeycolumn: fkName,
                    action: 'cad'
                }));
            }
            if(obj.action === 'upd'){
                if(this.dataDimLinks!=undefined) {
                    var dimLink = this.dataDimLinks.get(dimId);
                    if (dimLink != null) {
                        dimLink.set({
                            dimension: dimName
                        });
                    }
                }
                return;
            }
            else {
                var dimLink = this.dataDimLinks.get(dimId),
                    objDimLink = dimLink.toJSON();

                if (this.measureGroupAction === 'cad') {
                    dimLink.set({
                        id: dimId,
                        dimension: dimName,
                        foreignkeycolumn: fkName,
                        action: 'cad'
                    });
                }
                else {
                    if (objDimLink.flag) {
                        dimLink.set({
                            id: dimId,
                            oldDimension: obj.name,
                            dimension: dimName,
                            foreignkeycolumn: fkName,
                            action: 'edit',
                            flag: true
                        });
                    }
                    else if (objDimLink.action === 'cad') {
                        dimLink.set({
                            id: dimId,
                            dimension: dimName,
                            foreignkeycolumn: fkName,
                            action: 'cad'
                        });
                    }
                    else {
                        dimLink.set({
                            id: dimId,
                            oldDimension: obj.name,
                            dimension: dimName,
                            foreignkeycolumn: fkName,
                            action: 'edit',
                            flag: true
                        });
                    }
                }
            }
        }
        else {
            if (this.measureGroupAction === 'cad') {
                this.dataDimLinks.remove(dimId);
            }
            else {
                var dimLink = this.dataDimLinks.get(dimId),
                    objDimLink = dimLink.toJSON();

                if (objDimLink.action === 'edit') {
                    dimLink.set({
                        action: 'del'
                    });
                }
                else if (objDimLink.action === 'cad') {
                    this.dataDimLinks.remove(dimId);
                }
                else {
                    dimLink.set({
                        action: 'del'
                    });
                }
            }
        }

        this.back_dimlink();
    },

    save_dimlinks: function(cubeName, measureGroupName, objDimLinks, obj) {
        var measureGroups = this.args.mondrianSchema.cubes.get(cubeName).measuregroups.get(measureGroupName),
            objMeasureGroup = measureGroups.toJSON(),
            dimLinks = this.args.mondrianSchema.cubes.get(cubeName).measuregroups.get(measureGroupName).dimensionlinks,
            dimCube = this.args.mondrianSchema.cubes.get(cubeName).dimension;

        if (obj.action === 'cad') {
            var foreignKeyLink = dimLinks.foreignkeylink,
                factLink = dimLinks.factlink,
                len = objDimLinks.length,
                i;
            
            for (i = 0; i < len; i++) {
                var dim = this.args.mondrianSchema.dimension.get(objDimLinks[i].dimension);


                if (dim.get("table") === objMeasureGroup.table) {
                    factLink.add(new MondrianDimensionLinkFactLinkModel({
                        id: objDimLinks[i].dimension,
                        dimension: objDimLinks[i].dimension
                    }));
                }
                else {
                    foreignKeyLink.add(new MondrianDimensionLinkForeignKeyLinkModel({
                        id: objDimLinks[i].dimension,
                        dimension: objDimLinks[i].dimension,
                        foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                    }));                        
                }

                // Add shared dimension
                dimCube.add(new MondrianSharedDimensionModel({
                    id: objDimLinks[i].dimension,
                    source: objDimLinks[i].dimension,
                    foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                }));
            }
        }
        else {
            var foreignKeyLink = dimLinks.foreignkeylink,
                factLink = dimLinks.factlink,
                len = objDimLinks.length,
                i;

            for (i = 0; i < len; i++) {
                if (objDimLinks[i].action === 'cad') {
                    for (i = 0; i < len; i++) {
                        var dim = this.args.mondrianSchema.dimension.get(objDimLinks[i].id);

                        if (dim.get("table") === objMeasureGroup.table) {
                            factLink.add(new MondrianDimensionLinkFactLinkModel({
                                id: objDimLinks[i].id,
                                dimension: objDimLinks[i].dimension
                            }));
                        }
                        else {
                            foreignKeyLink.add(new MondrianDimensionLinkForeignKeyLinkModel({
                                id: objDimLinks[i].id,
                                dimension: objDimLinks[i].dimension,
                                foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                            }));                        
                        }

                        // Add shared dimension
                        dimCube.add(new MondrianSharedDimensionModel({
                            id: objDimLinks[i].id,
                            source: objDimLinks[i].dimension,
                            foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                        }));
                    }
                }
                else if (objDimLinks[i].action === 'edit') {
                    var foreignKeyLinkEdit = dimLinks.foreignkeylink.get(objDimLinks[i].id),
                        factLinkEdit = dimLinks.factlink.get(objDimLinks[i].id),
                        dimCubeEdit = this.args.mondrianSchema.cubes.get(cubeName).dimension.get(objDimLinks[i].id);

                    if (factLinkEdit) {
                        factLinkEdit.set({
                            id: objDimLinks[i].id,
                            dimension: objDimLinks[i].dimension,
                            foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                        });
                    }
                    else {
                        foreignKeyLinkEdit.set({
                            id: objDimLinks[i].id,
                            dimension: objDimLinks[i].dimension,
                            foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                        });
                    }

                    // Edit shared dimension
                    dimCubeEdit.set({
                        id: objDimLinks[i].id,
                        source: objDimLinks[i].dimension,
                        foreignkeycolumn: objDimLinks[i].foreignkeycolumn
                    });
                }
                else if (objDimLinks[i].action === 'del') {
                    var dimLinkName = objDimLinks[i].id;
                    foreignKeyLink.remove(dimLinkName);
                    factLink.remove(dimLinkName);
                    // Remove shared dimension
                    dimCube.remove(dimLinkName);
                }
            }
        }

        this.cancel_measure_group();
    }
});