/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "schema details" dialog
 */
var SchemaDetailsModal = Modal.extend({
    type: 'schema-details',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Schema Details',
        resizable: false,
        draggable: true
    },

    buttons: [
        { text: 'Create Schema', method: 'save_schema_name' },
        { text: 'Cancel', method: 'close' }
    ],

    events: {
        'click .dialog_footer a' : 'call',
        'focus .schema-name'     : 'check',
        'keyup #schema-name'     : 'remove_validation'
    },
    
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);

        var self = this;
        var schemaName;
        var dbSchemaName;

        if (this.dialog.OpenOptionsModal) {
            schemaName = this.dialog.dialog.mondrianSchema.toJSON();
        }
        else if (this.dialog.menuNewSchema) {
            schemaName = this.dialog.mondrianSchema.toJSON();
            schemaName.name = '';
        }
        else {
            schemaName = this.dialog.mondrianSchema.toJSON();
            dbSchemaName = this.dialog.dbSchemaName;
        }

        this.message = _.template(
            '<form class="form-group">' +
                '<label for="schema-name" class="i18n">Schema Name:</label>' +
                '<input type="text" class="schema-name" id="schema-name" value="<%= name %>">' +
                '<span class="error i18n" hidden>This field is required</span>' +
                '<label for="db-schema-name"><input type="checkbox" id="db-schema-name" class="i18n"> Add schema option to schema details?</label>' +
            '</form>')(schemaName);

		this.bind('open', function() {
            if (!self.dialog.OpenOptionsModal && !self.dialog.menuNewSchema) {
                this.$el.find('.dialog_footer a:nth-child(1)').text(' Save Schema ');

                if (dbSchemaName) {
                    this.$el.find('#db-schema-name').prop('checked', true);
                }
            }
        });
    },

    remove_validation: function() {
        this.$el.find('.form-group .error').hide();
    },

    check: function(event) {
        var self = this;

        $('.form-group').submit(function() {
            self.save_schema_name(event);
            return false;
        });
    },

    save_schema_name: function(event) {
        event.preventDefault();

        var schemaName = this.$el.find('input#schema-name').val();
        var isDBSchemaName = this.$el.find('#db-schema-name').is(':checked');

        if (schemaName) {
            if (this.dialog.OpenOptionsModal) {
                this.dialog.dialog.mondrianSchema.set({ name: schemaName });
                this.$el.dialog('destroy').remove();
                (new ConnDatabaseModal({ dialog: this, isDBSchemaName: isDBSchemaName })).render().open();
            }
            else if (this.dialog.menuNewSchema) {
                this.dialog.mondrianSchema.set({ name: schemaName });
                this.$el.dialog('destroy').remove();   
                (new ConnDatabaseModal({ dialog: this, isDBSchemaName: isDBSchemaName })).render().open();
            }
            else {
                this.dialog.mondrianSchema.set({ name: schemaName });
                $.notify('Saved successfully', { globalPosition: 'top center', className: 'success' });
                this.$el.dialog('destroy').remove();
            }
        }
        else {
            this.$el.find('input#schema-name').focus();
            this.$el.find('.form-group .error').show();
        }
    }
});