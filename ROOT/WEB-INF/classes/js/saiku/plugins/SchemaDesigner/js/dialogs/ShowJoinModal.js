/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "show join" dialog
 */
var ShowJoinModal = Modal.extend({
    type: 'join',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Join Configuration',
        resizable: false,
        draggable: true
    },

    buttons: [
        { text: 'Save', method: 'save_link' },
        { text: 'Cancel', method: 'cancel_link' }
    ],

    events: {
        'click .dialog_footer a'  : 'call',
        'change #join-key-column' : 'select_key_column'
    },
    
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.isJoinEdit = false;

        // Maintain `this`
        _.bindAll(this, 'cancel_link');

        var self = this,
            links = this.dialog.mondrianSchema.get('physicalschema').links,
            data = { 
                columns: this.option_template({ repoObjects: this.cols.toJSON2() })
            };

        if (links.get(this.tableNameSource + '_' + this.tableNameTarget)) {
            var objLinks = links.get(this.tableNameSource + '_' + this.tableNameTarget).toJSON(),
                objForeignKey = objLinks.foreignkey.models[0].column.toJSON(),
                foreignKeyName = objForeignKey.name,
                selectedForeignKey = '';

            this.isJoinEdit = true;

            $(data.columns).each(function(key, value) {
                if ($(value).text() === foreignKeyName) {
                    var option = $(value).attr('selected', 'selected');
                    selectedForeignKey += $(option).outerHTML();
                }
                else {
                    selectedForeignKey += $(value).outerHTML();
                }
            });

            data.columns = selectedForeignKey;
        }

        data.tableNameSource = this.tableNameSource;
        data.tableNameTarget = this.tableNameTarget;

        this.message = _.template(
            '<form class="form-group">' +
                '<label for="schema-name" class="i18n">Source Table: <b><%= tableNameSource %></b></label>' +
                '<label for="schema-name" class="i18n">Target Table: <b><%= tableNameTarget %></b></label><br>' +
                '<label for="schema-name" class="i18n">Foreign Key Column:</label>' +
                '<select id="join-key-column"><%= columns %></select>' +
                '<span class="error i18n" hidden>This field is required</span>' +
            '</form>')(data);

		this.bind('open', function() {
            this.$el.parents('.ui-dialog').find('.ui-dialog-titlebar-close').bind('click', self.cancel_link);
        });
    },

    option_template: function(obj) {
        return _.template(
            '<option value="">-- Select --</option>' +
            '<% _.each(obj.repoObjects, function(entry) { %>' +
                '<option value="<%= entry.name %>"><%= entry.name %></option>' +
            '<% }); %>'
        )(obj);
    },

    select_key_column: function(event) {
        event.preventDefault();
        this.$el.find('.form-group .error').hide();
        this.keyColumn = this.$el.find('select#join-key-column option:selected').val();
    },

    save_link: function(event) {
        event.preventDefault();

        var links = this.dialog.mondrianSchema.get('physicalschema').links;

        if (this.keyColumn) {
            if (links.get(this.tableNameSource + '_' + this.tableNameTarget)) {
                var objLinks = links.get(this.tableNameSource + '_' + this.tableNameTarget).toJSON(),
                    tableNameSource = objLinks.source,
                    tableNameTarget = objLinks.target,
                    objForeignKey = objLinks.foreignkey.models[0].column.toJSON(),
                    foreignKeyName = objForeignKey.name;

                if (tableNameSource === this.tableNameSource &&
                    tableNameTarget === this.tableNameTarget) {
                    var objLinks = links.get(this.tableNameSource + '_' + this.tableNameTarget),
                        foreignKey = objLinks.foreignkey,
                        column = foreignKey.models[0].column;

                    column.set({
                        id: this.keyColumn,
                        name: this.keyColumn
                    });
                }
                else {
                    links.add(new MondrianLinkModel({
                        id: this.tableNameSource + '_' + this.tableNameTarget,
                        source: this.tableNameSource,
                        target: this.tableNameTarget
                    }));

                    var objLinks = links.get(this.tableNameSource + '_' + this.tableNameTarget),
                        foreignKey = objLinks.foreignkey;

                    foreignKey.add(new MondrianLinkForeignKeyModel());

                    var column = foreignKey.models[0].column;

                    column.set({
                        id: this.keyColumn,
                        name: this.keyColumn
                    });
                }
            }
            else {
                links.add(new MondrianLinkModel({
                    id: this.tableNameSource + '_' + this.tableNameTarget,
                    source: this.tableNameSource,
                    target: this.tableNameTarget
                }));

                var objLinks = links.get(this.tableNameSource + '_' + this.tableNameTarget),
                    foreignKey = objLinks.foreignkey;

                foreignKey.add(new MondrianLinkForeignKeyModel());

                var column = foreignKey.models[0].column;

                column.set({
                    id: this.keyColumn,
                    name: this.keyColumn
                });
            }

            if (this.bindJsplumb) {
                // Add a new node in table
                this.dialog.bind_to_jsplumb({ tableSource: $(this.infoConn.source), tableTarget: $(this.infoConn.target) });
            }

            $.notify('Saved successfully', { globalPosition: 'top center', className: 'success' });

            this.$el.dialog('destroy').remove();
        }
        else {
            this.$el.find('.form-group .error').show();
        }
    },

    cancel_link: function(event) {
        event.preventDefault();
        if (!this.isJoinEdit) {
            jsPlumb.detach(this.infoConn.connection);
        }
        this.$el.dialog('destroy').remove();
    }
});