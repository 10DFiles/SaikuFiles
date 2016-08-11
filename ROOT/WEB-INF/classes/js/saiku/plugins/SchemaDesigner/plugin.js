/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The plugin schema designer
 */
Saiku.SchemaDesigner = {
    show: function() {
        if(ga!=undefined) {
            ga('send', 'event', 'SchemaDesigner', 'Open');
        }

        var tab = _.find(Saiku.tabs._tabs, function(tab) {
            return tab.content instanceof SchemaDesigner;
        });

        if (tab) {
            tab.select();
        }
        else {
            Saiku.tabs.add(new SchemaDesigner());
        }

        return false;
    }
};

/**
 * The schema designer view
 */
var SchemaDesigner = Backbone.View.extend({
    className: 'schema-designer',

    events: {
        'mouseover .menu-primary'              : 'menu_primary_handler',
        'mouseleave .menu-secondary'           : 'menu_secondary_handler',
        'click  .menu-list-item'               : 'menu_action_item',
        'click  .toolbar-action-item'          : 'menu_action_item',
        'click  .table-config'                 : 'show_table_editor_toolbar',
        'click  .workspace-canvas'             : 'hide_table_editor_toolbar',
        'click  .table-editor-action > button' : 'open_table_editor_dialog',
        'click  .plumbtable'                   : 'show_condition_panel'
    },

    menu_primary_handler: function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('.menu-primary').hide();
        $('.menu-secondary').show();
        return false;
    },

    menu_secondary_handler: function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('.menu-primary').show();
        $('.menu-secondary').hide();
        return false;
    },

    menu_action_item: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);

        switch ($currentTarget.data('action')) {
        case 'new-schema':
            this.menuNewSchema = true;
            (new SchemaDetailsModal({ dialog: this })).render().open();
            break;

        case 'schema-details':
            this.menuNewSchema = false;
            (new SchemaDetailsModal({ dialog: this })).render().open();
            break;

        case 'add-cubes-dim':
            (new CubesDimensionsModal({ data: this })).render().open();
            break;

        case 'create-schema':
            this.create_schema();
            break;

        case 'help':
            window.open('http://wiki.meteorite.bi/display/SAIK/Creating+schema+using+Saiku+Schema+Designer', '_blank');
            break;
        }

        return false;
    },

    show_table_editor_toolbar: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        $currentTarget.closest('.dbtable').find('.table-editor').show();
        $currentTarget.closest('.dbtable').find('.table-editor-toolbar').show();
    },

    hide_table_editor_toolbar: function(event) {
        var $target = $(event.target);
        if (!($target.hasClass('fa-cog'))) {
            this.$el.find('.workspace-canvas').find('.table-editor-toolbar-default').show();
            this.$el.find('.workspace-canvas').find('.table-editor-toolbar-del').hide();
            this.$el.find('.workspace-canvas').find('.table-editor').hide();
        }
    },

    open_table_editor_dialog: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);

        switch ($currentTarget.data().action) {
        case 'edit':
            (new TableEditModal({ dialog: this })).render().open();
            break;

        case 'delete':
            $currentTarget.closest('.table-editor-toolbar').find('.table-editor-toolbar-default').hide();
            $currentTarget.closest('.table-editor-toolbar').find('.table-editor-toolbar-del').show();
            break;

        case 'del-yes':
            var tableName = this.tableData.tablename,
                links = this.mondrianSchema.get('physicalschema').links,
                objLinks = links.toJSON(),
                lenEndpoints = jsPlumb.getEndpoints($currentTarget.closest('.dbtable'));
            
            this.mondrianSchema.get('physicalschema').tables.remove(tableName);

            _.filter(objLinks, function(value, key) {
                if (value.source === tableName ||
                    value.target === tableName) {
                    links.remove(value.id);
                }
            });
            
            $currentTarget.closest('.table-editor-toolbar').closest('.dbtable').remove();
            
            for (var i = 0; i < lenEndpoints.length; i++) {
                jsPlumb.deleteEndpoint(tableName + '_' + i);
            }

            // Show table in "Database Tables"
            $(this.$el.find('.workspace_results').find('.table-list').find('.dbtable')).each(function() {
                if ($(this).find('.table-wrapper').data('table') === tableName) {
                    $(this).closest('.dbtable').show();
                }
            });

            $.notify('Deleted successfully', { globalPosition: 'top center', className: 'success' });
            break;

        case 'del-no':
            $currentTarget.closest('.table-editor-toolbar').find('.table-editor-toolbar-default').show();
            $currentTarget.closest('.table-editor-toolbar').find('.table-editor-toolbar-del').hide();
            break;
        }

        return false;
    },

    caption: function() {
        return 'Schema Designer';
    },

    initialize: function() {
        // Initialize properties
        var self = this;
        this.tabId = this.tabId || '';
        this.jsPlumbClickTrigger = true;
        this.dbSchemaName = '';

        // Maintain `this`
        _.bindAll(this, 'adjust', 'adjust_workspace_canvas', 'remove_components', 'clear_element', 
            'table_objects', 'option_template', 'clear_physicalSchema', 'clear_cube_dim', 'bind_to_jsplumb');

        // Initialize repository
        this.connections = new DBConnectionsCollection(null, { dialog: this });

        // Initialize Mondrian schema
        this.mondrianSchemaOld = {};
        this.mondrianSchema = new MondrianSchemaModel({ 
            name: 'FoodMart', 
            physicalschema: new MondrianPhysicalSchemaModel()
        });

        // Initialize Mongo schema
        this.mongoSchema = new MongoSchemasCollection();
        this.mongoSchema.fetch();
        
        // Initialize jsPlumb        
        jsPlumb.ready(function() {
            jsPlumb.setContainer($(this.el).find('.workspace-canvas'));

            jsPlumb.bind('connection', function(info) {
                var currentSchema = self.currentSchema;
                jsPlumb.setContainer($(self.el).find('.workspace-canvas'));

                var tableNameSource = $(info.source).find('.table-name').text(),
                    tableNameTarget = $(info.target).find('.table-name').text(),
                    lenKeySource = self.mondrianSchema.get('physicalschema').tables.get(tableNameSource),
                    lenKeyTarget = self.mondrianSchema.get('physicalschema').tables.get(tableNameTarget),
                    cols = self.currentDatabase.schemas.get(currentSchema).tables.get(tableNameSource).columns;

                lenKeySource = lenKeySource.key.length;
                lenKeyTarget = lenKeyTarget.key.length;

                if (lenKeySource === 0) {
                    $.notify('You can select key(s) to table: ' + tableNameSource, {
                        globalPosition: 'top center', 
                        className: 'warn' 
                    });
                }

                if (lenKeyTarget === 0) {
                    $.notify('You can select key(s) to table: ' + tableNameTarget, {
                        globalPosition: 'top center', 
                        className: 'warn' 
                    });
                }

                (new ShowJoinModal({ 
                    dialog: self,
                    tableNameSource: tableNameSource, 
                    tableNameTarget: tableNameTarget, 
                    cols: cols,
                    infoConn: info,
                    bindJsplumb: true
                })).render().open();
            });

            jsPlumb.bind('click', function(conn) {
                var tableNameSource = $(conn.source).find('.table-name').text(),
                    tableNameTarget = $(conn.target).find('.table-name').text();

                if (self.jsPlumbClickTrigger &&
                    tableNameSource !== '' &&
                    tableNameTarget !== '') {
                    (new SwitchTablesModal({ 
                        dialog: self,
                        tableNameSource: tableNameSource, 
                        tableNameTarget: tableNameTarget, 
                        conn: conn
                    })).render().open();

                    self.jsPlumbClickTrigger = false;
                }
            });

            jsPlumb.bind('connectionMoved', function(info) {
                var newSource      = $(info.newSourceEndpoint.element).find('.table-name').text(),
                    newTarget      = $(info.newTargetEndpoint.element).find('.table-name').text(),
                    originalSource = $(info.originalSourceEndpoint.element).find('.table-name').text(),
                    originalTarget = $(info.originalTargetEndpoint.element).find('.table-name').text(),
                    endpointsSource = jsPlumb.getEndpoints($(info.originalSourceEndpoint.element)),
                    endpointsTarget = jsPlumb.getEndpoints($(info.originalTargetEndpoint.element));

                if (originalSource === newSource && originalTarget !== newTarget) {
                    self.mondrianSchema.get('physicalschema').links.remove(originalSource + '_' + originalTarget);

                    if (endpointsSource.length > 4) {
                        jsPlumb.deleteEndpoint(originalSource + '_' + (endpointsSource.length - 1));
                    }

                    if (endpointsTarget.length > 4) {
                        jsPlumb.deleteEndpoint(originalTarget + '_' + (endpointsTarget.length - 1));
                    }

                    $.notify('Connection between tables removed', { globalPosition: 'top center', className: 'warn' });
                }
            });

            jsPlumb.bind('connectionDetached', function(info) {
                var source         = $(info.source).find('.table-name').text(),
                    sourceEndpoint = $(info.sourceEndpoint.element).find('.table-name').text(),
                    target         = $(info.target).find('.table-name').text(),
                    targetEndpoint = $(info.targetEndpoint.element).find('.table-name').text(),
                    links = self.mondrianSchema.get('physicalschema').links,
                    endpointsSource = jsPlumb.getEndpoints($(info.source)),
                    endpointsTarget = jsPlumb.getEndpoints($(info.target));

                if (links.get(source + '_' + target)) {
                    links.remove(source + '_' + target);

                    if (endpointsSource.length > 4) {
                        jsPlumb.deleteEndpoint(source + '_' + (endpointsSource.length - 1));
                    }

                    if (endpointsTarget.length > 4) {
                        jsPlumb.deleteEndpoint(target + '_' + (endpointsTarget.length - 1));
                    }

                    $.notify('Connection between tables removed', { globalPosition: 'top center', className: 'warn' });
                }
            });
        });

        // Listen to result event
        Saiku.session.bind('tableEditModal:assign_key', this.add_keys_table);
    },

    bind_to_jsplumb: function(objTable) {
        var jsPlumbColor = '#ae1817',
            jsPlumbHoverColor = '#990100',
            jsPlumbAnchor = ['TopCenter', 'BottomCenter', 'Left', 'Right'],
            jsPlumbAnchorOthers = ['TopCenter', 'BottomCenter', 'Left', 'Right', 'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
            tableName = $(objTable.tableDefault).find('.table-wrapper').data('table'),
            tableNameSource = $(objTable.tableSource).find('.table-wrapper').data('table'),
            tableNameTarget = $(objTable.tableTarget).find('.table-wrapper').data('table');

        jsPlumb.setContainer(this.$el.find('.workspace-canvas'));

        if (objTable.tableDefault) {
            for (var i = 0; i < jsPlumbAnchor.length; i++) {
                jsPlumb.addEndpoint(objTable.tableDefault, 
                    { uuid: tableName + '_' + i }, {
                    isSource: true,
                    isTarget: true,
                    endpoint: ['Dot', { radius: 7 }],
                    endpointHoverStyle: {
                        fillStyle: jsPlumbHoverColor,
                        strokeStyle: jsPlumbHoverColor
                    },
                    anchor: [jsPlumbAnchor[i], { shape: 'Circle' }],
                    paintStyle: {
                        lineWidth: 3,
                        strokeStyle: jsPlumbColor
                    },
                    setDragAllowedWhenFull: true,
                    connector: ['Flowchart'],
                    connectorStyle: {
                        lineWidth: 3,
                        strokeStyle: jsPlumbColor
                    },
                    connectorHoverStyle: {
                        lineWidth: 4,
                        strokeStyle: jsPlumbHoverColor
                    },
                    overlays: [
                        ['Arrow', {
                            width: 10,
                            length: 10,
                            foldback: 1,
                            location: 1,
                            id: 'arrow'
                        }]
                    ],
                    connectorPaintStyle: {
                        lineWidth: 2,
                        strokeStyle: jsPlumbColor
                    }
                });
            }

            this.draggable_jsplumb(objTable.tableDefault);
        }
        else {
            var endpointsSource = jsPlumb.getEndpoints(objTable.tableSource);
            var endpointsTarget = jsPlumb.getEndpoints(objTable.tableTarget);

            if (endpointsSource.length <= 8) {
                jsPlumb.addEndpoint(objTable.tableSource, 
                    { uuid: tableNameSource + '_' + endpointsSource.length }, {
                    isSource: true,
                    isTarget: true,
                    endpoint: ['Dot', { radius: 7 }],
                    endpointHoverStyle: {
                        fillStyle: jsPlumbHoverColor,
                        strokeStyle: jsPlumbHoverColor
                    },
                    anchor: [jsPlumbAnchorOthers[endpointsSource.length], { shape: 'Circle' }],
                    paintStyle: {
                        lineWidth: 3,
                        strokeStyle: jsPlumbColor
                    },
                    setDragAllowedWhenFull: true,
                    connector: ['Flowchart'],
                    connectorStyle: {
                        lineWidth: 3,
                        strokeStyle: jsPlumbColor
                    },
                    connectorHoverStyle: {
                        lineWidth: 4,
                        strokeStyle: jsPlumbHoverColor
                    },
                    overlays: [
                        ['Arrow', {
                            width: 10,
                            length: 10,
                            foldback: 1,
                            location: 1,
                            id: 'arrow'
                        }]
                    ],
                    connectorPaintStyle: {
                        lineWidth: 2,
                        strokeStyle: jsPlumbColor
                    }
                });

                this.draggable_jsplumb(objTable.tableSource);
            }

            if (endpointsTarget.length <= 8) {
                jsPlumb.addEndpoint(objTable.tableTarget, 
                    { uuid: tableNameTarget + '_' + endpointsTarget.length }, {
                    isSource: true,
                    isTarget: true,
                    endpoint: ['Dot', { radius: 7 }],
                    endpointHoverStyle: {
                        fillStyle: jsPlumbHoverColor,
                        strokeStyle: jsPlumbHoverColor
                    },
                    anchor: [jsPlumbAnchorOthers[endpointsTarget.length], { shape: 'Circle' }],
                    paintStyle: {
                        lineWidth: 3,
                        strokeStyle: jsPlumbColor
                    },
                    setDragAllowedWhenFull: true,
                    connector: ['Flowchart'],
                    connectorStyle: {
                        lineWidth: 3,
                        strokeStyle: jsPlumbColor
                    },
                    connectorHoverStyle: {
                        lineWidth: 4,
                        strokeStyle: jsPlumbHoverColor
                    },
                    overlays: [
                        ['Arrow', {
                            width: 10,
                            length: 10,
                            foldback: 1,
                            location: 1,
                            id: 'arrow'
                        }]
                    ],
                    connectorPaintStyle: {
                        lineWidth: 2,
                        strokeStyle: jsPlumbColor
                    }
                });
                
                this.draggable_jsplumb(objTable.tableTarget);
            }
        }
    },

    // bind_to_jsplumb: function(divPlumbTable) {
    //     var jsPlumbColor = '#ae1817',
    //         jsPlumbHoverColor = '#990100',
    //         jsPlumbAnchor = ['TopCenter', 'BottomCenter', 'Left', 'Right'],
    //         tableName = $(divPlumbTable).find('.table-wrapper').data('table');

    //     jsPlumb.setContainer(this.$el.find('.workspace-canvas'));

    //     for (var i = 0; i < 4; i++) {
    //         jsPlumb.addEndpoint(divPlumbTable, 
    //             { uuid: tableName + '_' + i }, {
    //             isSource: true,
    //             isTarget: true,
    //             endpoint: ['Dot', { radius: 7 }],
    //             endpointHoverStyle: {
    //                 fillStyle: jsPlumbHoverColor,
    //                 strokeStyle: jsPlumbHoverColor
    //             },
    //             anchor: [jsPlumbAnchor[i], { shape: 'Circle' }],
    //             paintStyle: {
    //                 lineWidth: 3,
    //                 strokeStyle: jsPlumbColor
    //             },
    //             setDragAllowedWhenFull: true,
    //             connector: ['Flowchart'],
    //             connectorStyle: {
    //                 lineWidth: 3,
    //                 strokeStyle: jsPlumbColor
    //             },
    //             connectorHoverStyle: {
    //                 lineWidth: 4,
    //                 strokeStyle: jsPlumbHoverColor
    //             },
    //             overlays: [
    //                 ['Arrow', {
    //                     width: 10,
    //                     length: 10,
    //                     foldback: 1,
    //                     location: 1,
    //                     id: 'arrow'
    //                 }]
    //             ],
    //             connectorPaintStyle: {
    //                 lineWidth: 2,
    //                 strokeStyle: jsPlumbColor
    //             }
    //         });
    //     }

    //     this.draggable_jsplumb(divPlumbTable);
    // },

    draggable_jsplumb: function(divPlumbTable) {
        var self = this;

        jsPlumb.draggable(this.$el.find(divPlumbTable), {
            appendTo    : 'body',
            cancel      : '.not-draggable',
            containment : '.workspace-canvas',
            cursor      : isFF ? '-moz-grabbing' : '-webkit-grabbing',
            cursorAt    : { top: 10, left: 35 },
            grid        : [ 15, 15 ],
            helper      : 'clone',
            opacity     : 0.60,
            placeholder : 'placeholder',
            revert      : 'invalid',
            stack       : '.plumbtable',
            tolerance   : 'touch',
            drag        : function(event, ui) {
                self.$el.find('.workspace-canvas').find('.table-editor-toolbar-default').show();
                self.$el.find('.workspace-canvas').find('.table-editor-toolbar-del').hide();
                self.$el.find('.workspace-canvas').find('.table-editor').hide();

                var $bodyHeight = $('body').height(),
                    dragPageY = event.pageY + 268;

                if (dragPageY > $bodyHeight) {
                    $('body').height($bodyHeight + 50);
                    self.$el.find('.workspace-canvas').height($bodyHeight + 50);

                    self.adjust();
                    self.adjust_workspace_canvas();
                }
            }
        });
    },

    remove_components: function() {
        if (this.tabId === Saiku.session.tabSelected) {
            // Remove jsPlumb
            this.$el.find('.workspace-canvas').find('.svg').remove();
            this.$el.find('.workspace-canvas').find('.plumbtable').remove();
            jsPlumb.deleteEveryEndpoint();

            // Remove Notify
            $('.notifyjs-wrapper').remove();
        }
    },

    render: function() {
        var self = this;

        // Load templates
        this.$el.html(this.template());

        (new OpenOptionsModal({ dialog: this })).render().open();

        // Adjust tab when selected
        this.tab.bind('tab:select', this.adjust);
        $(window).resize(this.adjust);

        // To delete every Endpoint in jsPlumb
        Saiku.session.bind('tab:remove', this.remove_components);

        // The class .workspace-canvas a target for draggable elements
        this.$el.find('.workspace-canvas').droppable({
            accept: '.dbtable.ui-draggable',
            drop: function(event, ui) {
                var offset = ui.helper.offset();

                if (!ui.helper.hasClass('plumbtable')) {
                    var tableName = ui.helper.find('.table-name').text(),
                        element = ui.helper.clone();

                    $(ui.draggable).hide();

                    element.appendTo(this).offset(offset).addClass('plumbtable').css({ position: 'absolute', opacity: 1 })
                        .removeClass('ui-draggable').removeClass('ui-draggable-dragging');

                    $(element).click();
                    
                    element.find('.table-config').show();

                    var tableEditor = new TableEditor();
                    tableEditor.render();
                    element.closest('.dbtable').prepend(tableEditor.el);

                    self.bind_to_jsplumb({ tableDefault: element });

                    self.generate_table(tableName);

                    (new TableEditModal({ dialog: self })).render().open();
                }
            }
        });
        Saiku.i18n.translate();

        return this;
    },

    template: function() {
        return _.template(
            '<div class="workspace" style="margin-left: -305px">' +
                '<div class="workspace_toolbar">' +
                    '<ul>' +
                        '<li class="toolbar-action-item" data-action="open-schema"><a href="#" class="i18n open button disabled sprite" title="Open Schema"></a></li>' +
                        '<li class="toolbar-action-item" data-action="save-schema"><a href="#" class="i18n save button disabled sprite" title="Save Schema"></a></li>' +
                        '<li class="seperator toolbar-action-item" data-action="new-schema"><a href="#" class="i18n new button sprite" title="New Schema"></a></li>' +
                        '<li class="seperator toolbar-action-item" data-action="schema-details"><a href="#" class="i18n schema-details button" title="Schema Details"></a></li>' +
                        '<li class="toolbar-action-item" data-action="add-cubes-dim"><a href="#" class="i18n add-cubes-dim button" title="Add Cubes and Dimensions"></a></li>' +
                        '<li class="toolbar-action-item" data-action="create-schema"><a href="#" class="i18n create-schema button" title="Create Schema"></a></li>' +
                    '</ul>' +
                    '<ul style="float: right">' +
                        '<li class="toolbar-action-item" data-action="help"><a href="#" class="i18n help button" title="Help Wiki"></a></li>' +
                    '</ul>' +
                '</div>' +
                '<div class="workspace_results hide">' +
                    '<div class="loading i18n">Loading...</div>' +
                    '<div class="table-list"></div>' +
                '</div>' +
                '<div class="workspace-canvas"></div>' +
            '</div>'   
        );
    },

    column_template_objects: function(obj) {
        return _.template(
            '<% if (obj.repoObjects.length > 3) { %>' + 
                '<% for (var i = 0; i <= 3; i++) { %>' +
                    '<tr class="column truncate">' +
                        '<td><%= obj.repoObjects[i].name %></td>' +
                    '</tr>' +
                '<% } %>' +
                '<tr class="column">' +
                    '<td>...</td>' + 
                '</tr>' +
            '<% } else { %>' +
                '<% _.each(obj.repoObjects, function(entry) { %>' +
                    '<tr class="column truncate">' +
                        '<td><%= entry.name %></td>' +
                    '</tr>' +
                '<% }); %>'+
            '<% } %>'
        )(obj);
    },

    option_template: function(obj) {
        return _.template(
            '<% _.each(obj.repoObjects, function(entry) { %>' +
                '<option value="<%= entry.name %>"><%= entry.name %></option>' +
            '<% }); %>'
        )(obj);
    },

    adjust: function() {
        // Adjust the height of the separator
        $separator = this.$el.find('.sidebar_separator');
        $separator.height($('body').height() - 87);

        // Adjust the height of the workspace canvas
        $workspaceCanvas = this.$el.find('.workspace-canvas');
        $workspaceCanvas.height($('body').height() - 87);

        // Adjust the width and height of the sidebar
        this.$el.find('.sidebar').css({
            width: 300, 
            height: $('body').height() - 87
        });

        // Adjust the margin-left of the workspace
        this.$el.find('.workspace').css({ 'margin-left': -305 });
        this.$el.find('.workspace_inner').css({ 'margin-left': 305 });
    },

    adjust_workspace_canvas: function() {
        // Adjust the height of the workspace canvas
        $workspaceCanvas = this.$el.find('.workspace-canvas');
        $workspaceCanvas.height(($('body').height() - this.$el.find('.workspace_results').height()) - 140);
    },

    clear_element: function(attribute) {
        this.$el.find(attribute).empty();
    },

    table_objects: function(attribute, repository, dialog) {
        var json = repository.columns.toJSON2(),
            columns,
            tableView;

        this.currentDatabase = dialog.currentDatabase;
        this.currentSchema = dialog.currentSchema;

        columns = this.column_template_objects({ repoObjects: json });

        tableView = new TableView({
            name: repository.id,
            schema: repository.parentSchema,
            columns: columns
        }, this);
        tableView.render();
        this.$el.find(attribute).append(tableView.el);

        this.$el.find('.menu-canvas').find('.menu-primary').css('position', 'fixed');
        this.$el.find('.menu-canvas').find('.menu-secondary').css('position', 'fixed');
    },

    add_keys_table: function(args) {
        if (args.selectedKeys) {
            $(args.workspace.dialog.$el.find('.workspace-canvas').find('.dbtable').find('.table-wrapper')).each(function() {
                if ($(this).data('table') === args.tableName) {

                    $(this).find('table').find('tbody > tr').remove();

                    $(this).find('table').find('tbody').each(function() {
                        for (var i = args.newCols.length; i >= 1; i--) {
                            $(this).prepend('<tr class="column truncate"><td>' + args.newCols[i-1] + '</td></tr>');
                        }
                    });

                    for (var i = 0, len = args.selectedKeys.length; i < len; i++) {
                        $(this).find('table').find('tbody').find('.column').each(function() {
                            if ($(this).text() === args.selectedKeys[i]) {
                                $(this).css('backgroundColor', '#edf4fA');
                                $(this).find('td').css('fontWeight', 'bold');
                            }
                        });
                    }
                }
            });
        }
    },

    generate_table: function(name) {
        var tables = this.mondrianSchema.get('physicalschema').tables;
        tables.add(new MondrianTableModel({ id: name, name: name, schema: this.dbSchemaName }));        
    },

    show_condition_panel: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            tableName = $currentTarget.find('.table-name').text(),
            currentSchema = this.currentSchema,
            objDatabase = this.currentDatabase.schemas.get(currentSchema),
            objTable = objDatabase.tables.get(tableName),
            cols = this.option_template({ repoObjects: objTable.columns.toJSON2() });

        this.tableData = {
            tablename: tableName, 
            repoObjects: '',
            objCols: objTable.columns.toJSON2(),
            columns: cols 
        };
    },

    create_schema: function(event) {
        if (event) {
            event.preventDefault();
        }

        // console.info(this.mondrianSchemaOld);
        // console.info(JSON.stringify(this.mondrianSchemaOld.toJSON()));
        console.info(this.mondrianSchema);
        console.info(JSON.stringify(this.mondrianSchema.toJSON()));

        // var data = {"name":"FoodMart","physicalSchema":{"tables":[{"name":"wp_comments","key":[{"column":[{"name":"comment_post_ID"}]}]},{"name":"wp_links","key":[{"column":[{"name":"link_name"}]}]}],"links":[{"source":"wp_comments","target":"wp_links","foreignkey":[{"column":{"name":"comment_ID"}}]}]},"dimension":[{"name":"wp_comments","table":"wp_comments","keycolumn":null,"attributes":[{"attribute":[]}],"hierarchies":[{"hierarchy":[]}]},{"name":"wp_links","table":"wp_links","keycolumn":null,"attributes":[{"attribute":[{"name":"Link id","hashierarchy":false,"key":[{"column":[{"name":"link_id"},{"name":"link_url"}]}]},{"name":"Link url","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link name","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link image","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link target","hashierarchy":false,"key":[{"column":[{"name":"link_name"},{"name":"link_image"}]}]},{"name":"Link description","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link visible","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link owner","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link rating","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link updated","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link rel","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link notes","hashierarchy":false,"key":[{"column":[]}]},{"name":"Link rss","hashierarchy":false,"key":[{"column":[]}]}]}],"hierarchies":[{"hierarchy":[{"name":"hier","allmembername":"all","levels":[{"attribute":"Link id"},{"attribute":"Link image"}]}]}]}],"cubes":[{"name":"Cube 1","defaultMeasure":"","annotations":"","calculatedMembers":"","measuregroups":[{"name":"Default","table":"wp_comments","measures":[{"measure":[{"name":"mear","column":"comment_ID","aggregator":"Sum"}]}],"dimensionlinks":{"foreignkeylink":[{"dimension":"wp_comments","foreignkeycolumn":"comment_ID"}]}}]}]};
        if(ga!=undefined) {
            ga('send', 'event', 'SchemaDesigner', 'Save');
        }
        this.mondrianSchema.save({}, {
            data: JSON.stringify(this.mondrianSchema.toJSON()), 
            // data: JSON.stringify(data), 
            contentType: 'application/json',
            success: function(res) {
                $.notify('Schema successfully created!', { globalPosition: 'top center', className: 'success' });
                //alert('Schema successfully created!');
                console.log(res);
            },
            error: function(err) {
                alert('Error to create the Schema!');
                console.log(err);
            }
        });
    },

    clear_physicalSchema: function() {
        var objTables = this.mondrianSchema.get('physicalschema').tables.toJSON(),
            objLinks = this.mondrianSchema.get('physicalschema').tables.toJSON(),
            lenTables = objTables.length,
            lenLinks = objLinks.length,
            i, j;

        for (i = 0; i < lenTables; i++) {
            this.mondrianSchema.get('physicalschema').tables.remove(objTables[i].id);
        }

        for (j = 0; j < lenLinks; j++) {
            this.mondrianSchema.get('physicalschema').links.remove(objLinks[j].id);
        }
    },

    clear_cube_dim: function() {
        var objCubes = this.mondrianSchema.cubes.toJSON(),
            objDims = this.mondrianSchema.dimension.toJSON(),
            lenCubes = objCubes.length,
            lenDims = objDims.length,
            i, j;

        for (i = 0; i < lenCubes; i++) {
            this.mondrianSchema.cubes.remove(objCubes[i].id);
        }

        for (j = 0; j < lenDims; j++) {
            this.mondrianSchema.dimension.remove(objDims[j].id);
        }
    }
});

Saiku.events.bind('session:new', function() {
    // Load CSS
    Saiku.loadCSS('js/saiku/plugins/SchemaDesigner/components/fontawesome/css/font-awesome.min.css');
    //Saiku.loadCSS('js/saiku/plugins/SchemaDesigner/components/chosen_v1.3.0/chosen.css');
    Saiku.loadCSS('js/saiku/plugins/SchemaDesigner/css/plugin.css');
    // Load JS
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/brandon-aaron-jquery-outerhtml-function/jquery.outerhtml.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/jsplumb/dist/js/jquery.jsPlumb-1.7.2-min.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/notifyjs/dist/notify.min.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/notifyjs/dist/styles/bootstrap/notify-bootstrap.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/easytabs/lib/jquery.easytabs.min.js');
    //Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/chosen_v1.3.0/chosen.jquery.min.js');
    //Saiku.loadJS('js/saiku/plugins/SchemaDesigner/components/chosen_v1.3.0/chosen-sortable.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/ui/TableView.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/ui/TableEditor.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/models/DBConnection.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/models/MongoSchema.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/models/MondrianSchema.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/OpenOptionsModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/ConnDatabaseModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/SchemaDetailsModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/CubesDimensionsModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/TableEditModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/ShowJoinModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/AlertModal.js');
    Saiku.loadJS('js/saiku/plugins/SchemaDesigner/js/dialogs/SwitchTablesModal.js');

    if (Saiku.session.isAdmin) {
        var $link = $('<a />')
            .attr({
                href: '#schema_designer',
                title: 'Schema Designer'
            })
            .click(Saiku.SchemaDesigner.show)
            .addClass('schema_designer i18n')
            .append('<span style="float:right;background-color: darkgray;color:white;border-radius: 3px;">beta</span>');

        var $li = $('<li />').append($link);
        Saiku.toolbar.$el.find('ul').append($li).append('<li class="separator">&nbsp;</li>');
    }
});
