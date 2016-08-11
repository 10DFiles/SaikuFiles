/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "switch tables" dialog
 */
var SwitchTablesModal = Modal.extend({
	type: 'switch-tables',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Switch Tables',
        resizable: false,
        draggable: true
    },

    buttons: [
        { text: 'Switch Tables', method: 'save_switch_tables' },
        { text: 'Cancel', method: 'close' }
    ],

    events: {
        'click .dialog_footer a'  : 'call',
        'change #select-source-table' : 'select_source_target_table',
        'change #select-target-table' : 'select_source_target_table',
        'change .error-check'         : 'error_check'
    },

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        var self = this,
            data = {
                tableNameSource: this.tableNameSource,
                tableNameTarget: this.tableNameTarget
            };

        this.options.beforeClose = function(event, ui) {
            self.dialog.jsPlumbClickTrigger = true;                
        };

        this.message = _.template(
            '<form class="form-group">' +
                '<label for="select-key" class="i18n">Select source table:</label>' +
                '<select class="error-check" id="select-source-table">' +
                    '<option value="<%= tableNameSource %>" selected><%= tableNameSource %></option>' +
                    '<option value="<%= tableNameTarget %>"><%= tableNameTarget %></option>' +
                '</select>' +
                '<span class="error i18n" hidden>The tables cannot be equal</span>' +
                '<label for="select-key" class="i18n">Select target table:</label>' +
                '<select class="error-check" id="select-target-table">' +
                    '<option value="<%= tableNameSource %>"><%= tableNameSource %></option>' +
                    '<option value="<%= tableNameTarget %>" selected><%= tableNameTarget %></option>' +
                '</select>' +
                '<span class="error i18n" hidden>The tables cannot be equal</span>' +
            '</form>')(data);
        
        this.bind('open');
    },

    select_source_target_table: function(event) {
        event.preventDefault();
        this.newTableNameSource = this.$el.find('select#select-source-table option:selected').val();
        this.newTableNameTarget = this.$el.find('select#select-target-table option:selected').val();
    },

    save_switch_tables: function(event) {
        event.preventDefault();

        var links = this.dialog.mondrianSchema.get('physicalschema').links;

        if ((this.newTableNameSource === undefined && this.newTableNameTarget === undefined) || 
            (this.newTableNameSource === this.tableNameSource && this.newTableNameTarget === this.tableNameTarget)) {
            this.close(event);   
        }
        else if (this.newTableNameSource !== this.newTableNameTarget) {
            links.remove(this.tableNameSource + '_' + this.tableNameTarget);

            links.add(new MondrianLinkModel({
                id: this.newTableNameSource + '_' + this.newTableNameTarget,
                source: this.newTableNameSource,
                target: this.newTableNameTarget
            }));

            var objLinks = links.get(this.newTableNameSource + '_' + this.newTableNameTarget),
                foreignKey = objLinks.foreignkey;

            foreignKey.add(new MondrianLinkForeignKeyModel());

            var lenKeySource = this.dialog.mondrianSchema.get('physicalschema').tables.get(this.newTableNameSource),
                lenKeyTarget = this.dialog.mondrianSchema.get('physicalschema').tables.get(this.newTableNameTarget),
                cols = this.dialog.currentDatabase.schemas.get(this.dialog.currentSchema).tables.get(this.newTableNameSource).columns,
                conn = {
                    sourceId: this.conn.sourceId,
                    targetId: this.conn.targetId,
                    source: this.conn.source,
                    target: this.conn.target,
                    sourceEndpoint: this.conn.endpoints[0],
                    targetEndpoint: this.conn.endpoints[1]
                };

            this.switch_conns(conn);

            (new ShowJoinModal({ 
                dialog: this.dialog,
                tableNameSource: this.newTableNameSource, 
                tableNameTarget: this.newTableNameTarget, 
                cols: cols,
                infoConn: this.conn,
                bindJsplumb: false
            })).render().open();

            this.close(event);
        }
        else {
            this.$el.find('.form-group .error').show();
        }
    },

    switch_conns: function(conn) {
        this.conn.sourceId = conn.targetId;
        this.conn.targetId = conn.sourceId;
        this.conn.source = conn.target;
        this.conn.target = conn.source;
        this.conn.endpoints[0] = conn.targetEndpoint;
        this.conn.endpoints[1] = conn.sourceEndpoint;
    },

    error_check: function(event) {
        event.preventDefault();
        if (this.newTableNameSource === this.newTableNameTarget) {
            this.$el.find('.form-group .error').show();
        }
        else {
            this.$el.find('.form-group .error').hide();
        }
    },

    close: function(event) {
        event.preventDefault();
        this.dialog.jsPlumbClickTrigger = true;
        $(this.el).dialog('destroy').remove();
        return false;
    }
});