/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "open options" dialog
 */
var OpenOptionsModal = Modal.extend({
	type: 'open-options',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Schema Designer',
        resizable: false,
        draggable: true
    },

    message: '<p class="i18n">Create a new schema or open an existing project?</p>',

    buttons: [
        { text: 'New', method: 'new_schema' },
        { text: 'Open', method: 'open_edit' },
        { text: 'Cancel', method: 'close' }
    ],

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.OpenOptionsModal = true;
        
        this.bind('open');
    },

    open_edit: function(args){
        $.notify('Edit functionality coming soon!', {
            globalPosition: 'top center',
            className: 'error'
        });
    },
    new_schema: function(event) {
        event.preventDefault();
        (new SchemaDetailsModal({ dialog: this })).render().open();
        this.$el.dialog('destroy').remove();
    }
});