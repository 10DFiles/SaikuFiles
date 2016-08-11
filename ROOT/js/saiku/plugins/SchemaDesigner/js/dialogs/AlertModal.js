/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "alert" dialog
 */
var AlertModal = Modal.extend({
	type: 'alert',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Alert',
        resizable: false,
        draggable: false
    },

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);

        this.message = _.template(this.message)({});
        
        this.bind('open');
    }
});