/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The menu canvas
 */
var MenuCanvas = Backbone.View.extend({
    className: 'menu-canvas',

    template: _.template(
        '<div class="menu-primary">' +
            '<span><i class="fa fa-bars fa-lg"></i></span>' +
        '</div>' +
        '<nav class="menu-secondary" hidden>' +
            '<ul class="menu-list">' +
                '<li class="menu-list-item is-first" data-action="new-schema">' +
                    '<span><i class="fa fa-cube"></i></span>' +
                    '<a href="#" class="i18n">New Schema</a>' +
                '</li>' +
                // '<li class="menu-list-item" data-action="conn-db">' +
                //     '<span><i class="fa fa-plug"></i></span>' +
                //     '<a href="#">Connect Database</a>' +
                // '</li>' +
                '<li class="menu-list-item" data-action="schema-details">' +
                    '<span><i class="fa fa-database"></i></span>' +
                    '<a href="#" class="i18n">Schema Details</a>' +
                '</li>' +
                '<li class="menu-list-item" data-action="add-cubes-dim">' +
                    '<span><i class="fa fa-plus"></i></span>' +
                    '<a href="#" class="i18n">Add Cubes and Dimensions</a>' +
                '</li>' +
                '<li class="menu-list-item" data-action="create-schema">' +
                    '<span><i class="fa fa-code"></i></span>' +
                    '<a href="#" class="i18n">Create Schema</a>' +
                '</li>' +
                '<li class="menu-list-item" data-action="save-schema">' +
                    '<span><i class="fa fa-save"></i></span>' +
                    '<a href="#" class="i18n">Save Schema</a>' +
                '</li>' +
                '<li class="menu-list-item is-last" data-action="print-schema">' +
                    '<span><i class="fa fa-print"></i></span>' +
                    '<a href="#" class="i18n">Print Schema</a>' +
                '</li>' +
            '</ul>' +
        '</nav>'
    ),

    initialize: function() {
        // Maintain `this`
        _.bindAll(this, 'render');
    },    

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});