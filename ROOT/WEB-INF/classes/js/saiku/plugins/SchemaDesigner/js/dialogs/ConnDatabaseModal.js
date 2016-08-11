/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "connect database" dialog
 */
var ConnDatabaseModal = Modal.extend({
    type: 'conn-db',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Connection Details',
        resizable: false,
        draggable: true
    },

    message: '<form class="form-group">' +
                 '<div class="panel-connection">' +
                    '<label for="connectiontype" class="i18n">Connection Type:</label>' +
                    '<select name="connectiontype" id="connectiontype">' +
                        '<option>SQL</option>' +
                        '<option>Mongo</option>' +
                    '</select>' +
                    '<div id="consql">' +
                        '<label for="dbdriver" class="i18n">Driver:</label>' +
                        '<input type="text" class="error-check" id="dbdriver" placeholder="eg: com.mysql.jdbc.Driver" value="">' +
                        '<span class="error err-1 i18n" hidden>This field is required</span>' +
                        '<label for="dburl" class="i18n">URL:</label>' +
                        '<input type="text" class="error-check" id="dburl" placeholder="eg: jdbc:mysql://localhost value="">' +
                        '<span class="error err-2 i18n" hidden>This field is required</span>' +
                        '<label for="dbuser-name" class="i18n">Username:</label>' +
                        '<input type="text" class="error-check" id="dbuser-name" value="">' +
                        '<span class="error err-3 i18n" hidden>This field is required</span>' +
                        '<label for="dbpassword" class="i18n">Password:</label>' +
                        '<input type="password" id="dbpassword" value="">' +
                    '</div>' +
                    '<div id="conmongo" hidden>' +
                        '<label for="mongosource" class="i18n">Mongo Schema:</label>' +
                        '<select id="mongosource" name="mongosource"></select>' +
                    '</div>' +
                 '</div>' +
                 '<div class="panel-databases" hidden>' +
                    '<label for="database-list" class="i18n">Available Databases:</label>' +
                    '<select class="database error-check" id="database-list"></select>' +
                    '<span class="error err-4 i18n" hidden>This field is required</span>' +
                    '<label for="schema-list i18n">Database Schema:</label>' +
                    '<select class="schema error-check" id="schema-list"></select>' +
                    '<span class="error err-5 i18n" hidden>This field is required</span>' +
                 '</div>' +
             '</form>',

    buttons: [
        { text: 'Connect', method: 'connect_database' },
        { text: '&laquo; Back', method: 'back_panel' },
        { text: 'Get Tables', method: 'get_tables' },
        { text: 'Data Sources', method: 'get_data_sources' },
        { text: 'Cancel', method: 'close' },
        { text: 'Help', method: 'get_help'}
    ],

    events: {
        'click  .dialog_footer a' : 'call',
        'change #connectiontype'  : 'change_connection',
        'change #mongosource'     : 'change_jdbc_url',
        'change .database'        : 'get_schema',
        'keyup  .error-check'     : 'remove_validation',
        'change .error-check'     : 'remove_validation'
    },
    
    initialize: function(args) {
        // Initialize properties
    	this.args = args.dialog;
        this.isDBSchemaName = args.isDBSchemaName;

        if (this.args.dialog) {
            if (this.args.dialog.OpenOptionsModal) {
                this.args = this.args.dialog.dialog;
            }
            else if (this.args.dialog.menuNewSchema) {
                this.args = this.args.dialog;
            }
        }

        // Maintain `this`
        _.bindAll(this, 'populate_dbs', 'populate_schema');

		this.bind('open', function() {
            this.$el.find('.dialog_footer a:nth-child(2)').hide();
            this.$el.find('.dialog_footer a:nth-child(3)').hide();
        });
    },

    get_help : function(event){
        var win = window.open("http://wiki.meteorite.bi/display/SAIK/Creating+schema+using+Saiku+Schema+Designer#CreatingschemausingSaikuSchemaDesigner-Connecting", '_blank');
        win.focus();
    },
    change_connection: function(event){
        event.preventDefault();

        var $currentTarget = $(event.currentTarget),
            vals = $currentTarget.val();

        if(vals === 'SQL') {
            this.$el.find('#dbdriver').val('');
            this.$el.find('#dburl').val('');
            this.$el.find('#dbuser-name').val('');
            this.$el.find('#dbpassword').val('');
            this.$el.find('#consql').show();
            this.$el.find('#conmongo').hide();
        }
        else if(vals === 'Mongo') {
            var selector = this.$el.find('#mongosource');
            _.each(this.args.mongoSchema.models, function(item) {
                selector.append($('<option></option>')
                    .attr('value', item.get('path'))
                    .text(item.get('name')));
            },this);

            this.$el.find('#dbdriver').val('org.apache.calcite.jdbc.Driver');
            this.$el.find('#dburl').val('jdbc:calcite:model=mongo://' + selector.val());
            this.$el.find('#dbuser-name').val('admin');
            this.$el.find('#dbpassword').val('admin');
            this.$el.find('#consql').hide();
            this.$el.find('#conmongo').show();
        }
    },

    change_jdbc_url: function(event) {
    	event.preventDefault();
        var selector = this.$el.find('#mongosource');
        this.$el.find('#dburl').val('jdbc:calcite:model=mongo://' + selector.val());
    },

    connect_database: function(event) {
        event.preventDefault();

        this.$el.find('.form-group .error').hide();

        var dbDriver   = this.$el.find('input#dbdriver').val(),
            dbUrl      = this.$el.find('input#dburl').val(),
            dbUserName = this.$el.find('input#dbuser-name').val(),
            dbPassword = this.$el.find('input#dbpassword').val(),
            connection = new DBConnectionModel(null, { dialog: this }),
            isPassed   = false;

        if (dbDriver) {
            isPassed = true;            
        }
        else {
            isPassed = false;
            this.$el.find('.form-group .err-1').show();
        }
        if (dbUrl) {
            isPassed = true;            
        }
        else {
            isPassed = false;
            this.$el.find('.form-group .err-2').show();
        }
        if (dbUserName) {
            isPassed = true;            
        }
        else {
            isPassed = false;
            this.$el.find('.form-group .err-3').show();
        }

        if (isPassed && (dbDriver && dbUrl && dbUserName)) {
            connection.set({
                driver: dbDriver,
                url: dbUrl,
                username: dbUserName,
                password: dbPassword
            });

            connection.save({}, {
                data: JSON.stringify(connection.attributes),
                contentType: 'application/json',
                success: function(res) {
                	res.dialog.$el.find('.panel-connection').hide();
                	res.dialog.$el.find('.panel-databases').show();
                    res.dialog.$el.find('.dialog_footer a:nth-child(1)').hide();
                    res.dialog.$el.find('.dialog_footer a:nth-child(2)').show();
                    res.dialog.$el.find('.dialog_footer a:nth-child(3)').show();
                },
                error: function(err) {
                    $.notify('Could not connect in the database', { 
                        globalPosition: 'top center', 
                        className: 'error' 
                    });
                    err.dialog.$el.dialog('destroy').remove();
                }
            });

            this.args.connections.add(connection);
        }

        return false;
    },

    remove_validation: function(event) {
        var $currentTarget = $(event.currentTarget);

        switch ($currentTarget.attr('id')) {
        case 'dbdriver':
            this.$el.find('.form-group .err-1').hide();
            break;

        case 'dburl':
            this.$el.find('.form-group .err-2').hide();
            break;

        case 'dbuser-name':
            this.$el.find('.form-group .err-3').hide();
            break;

        case 'database-list':
            this.$el.find('.form-group .err-4').hide();
            break;

        case 'schema-list':
            this.$el.find('.form-group .err-5').hide();
            break;

        default:
            this.$el.find('.form-group .error').hide();
        }
    },

    back_panel: function(event) {
        event.preventDefault();
        this.$el.find('.panel-connection').show();
        this.$el.find('.panel-databases').hide();
        this.$el.find('.dialog_footer a:nth-child(1)').show();
        this.$el.find('.dialog_footer a:nth-child(2)').hide();
        this.$el.find('.dialog_footer a:nth-child(3)').hide();
    },

    databases_template: function(databases) {
        return _.template(
        	'<option value="">-- Select --</option>' +
			'<% _.each(databases, function(entry) { %>' +
				'<option value="<%= entry %>"><%= entry %></option>' +
			'<% }); %>'
        )(databases);
    },

    populate_dbs: function(arr) {
    	this.$el.find('#database-list').empty();
        var html = this.databases_template({ databases: arr.databases });
        this.$el.find('#database-list').append(html);
    },

    get_schema: function(event) {
    	event.preventDefault();

        var $currentTarget = $(event.currentTarget),
        	name           = $($currentTarget).val(),
        	connection     = this.args.connections.last(),
        	database       = connection.dbs.get(name);

        database.fetch();

    	this.currentDatabase = database;
    },

    schema_template: function(schema) {
        return _.template(
        	'<option value="">-- Select --</option>' +
			'<% _.each(schema, function(entry) { %>' +
				'<option value="<%= entry.name %>"><%= entry.name %></option>' +
			'<% }); %>'
        )(schema);
    },

    populate_schema: function(arr) {
    	this.$el.find('#schema-list').empty();
        var html = this.schema_template({ schema: arr.schema });
        this.$el.find('#schema-list').append(html);
    },

    get_tables: function(event) {
    	event.preventDefault();

        this.$el.find('.form-group .error').hide();

    	var dbSelected     = this.$el.find('select#database-list option:selected').val();
        var schemaSelected = this.$el.find('select#schema-list option:selected').val();
        var isPassed       = false;
        var dbSchemaName;

        if (this.isDBSchemaName) {
            dbSchemaName = schemaSelected;
        }

        if (dbSelected) {
            isPassed = true;
        }
        else {
            isPassed = false;
            this.$el.find('.form-group .err-4').show();
        }
        if (schemaSelected) {
            isPassed = true;
            var schema = this.currentDatabase.schemas.get(schemaSelected);
        }
        else {
            isPassed = false;
            this.$el.find('.form-group .err-5').show();
        }

    	if (isPassed && (dbSelected && schemaSelected)) {
            Saiku.ui.block('Loading...');
            this.args.clear_element('.table-list');
            this.args.$el.find('.workspace_toolbar').removeClass('hide');
            this.args.$el.find('.workspace_results').removeClass('hide');

            schema.fetch({ 
                success: function(res) {
                    res.dialog.args.tabId = Saiku.session.tabSelected;
                    res.dialog.args.dbSchemaName = dbSchemaName;
                    res.dialog.args.remove_components();
                    res.dialog.args.clear_physicalSchema();
                    res.dialog.args.clear_cube_dim();
                    res.dialog.args.$el.find('.workspace_results').find('.loading').hide();
                    _.delay(res.dialog.args.adjust_workspace_canvas, 1000);
                } 
            });

            this.currentSchema = schemaSelected;

            $.notify('Connection successful', { globalPosition: 'top center', className: 'success' });

            this.$el.dialog('destroy').remove();
        }
    },

    populate_tables: function(opts, callback) {
        if (opts.clear) {
            this.clear_element(opts.attribute);
        }

        if (callback && typeof(callback) === 'function') {
            callback(opts.attribute, opts.repository, opts.dialog);
        }
    },

    get_data_sources: function(event) {
        event.preventDefault();
        var formElements = {
            'url': '#dburl',
            'driver': '#dbdriver',
            'username': '#dbuser-name',
            'password': '#dbpassword'
        };
        (new DataSourcesModal({ dialog: this, formElements: formElements })).render().open();
        this.$el.parents('.ui-dialog').find('.ui-dialog-title').text('Connection Details');
    }
});
