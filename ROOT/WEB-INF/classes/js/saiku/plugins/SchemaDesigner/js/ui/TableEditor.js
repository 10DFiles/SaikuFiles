/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The table editor
 */
var TableEditor = Backbone.View.extend({
    className: 'table-editor',

    template: _.template(
        '<div class="table-editor-toolbar table-toolbar-arrow-under table-editor-toolbar-active" hidden>' +
            '<ul class="table-editor-toolbar-default clearfix">' +
                '<li class="table-editor-action"><button class="table-editor-button-first" data-action="edit"><i class="fa fa-edit"></i></button></li>' +
                // '<li class="table-editor-action"><button data-action="view"><i class="fa fa-eye"></i></button></li>' +
                '<li class="table-editor-action"><button class="table-editor-button-last" data-action="delete"><i class="fa fa-trash"></i></button></li>' +
            '</ul>' +
            '<ul class="table-editor-toolbar-del clearfix" hidden>' +
                '<li class="table-editor-action"><button class="table-editor-button-first" data-action="del-yes"><i class="fa fa-check"></i></button></li>' +
                '<li class="table-editor-action"><button class="table-editor-button-last" data-action="del-no"><i class="fa fa-close"></i></button></li>' +
            '</ul>' +
        '</div>'
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