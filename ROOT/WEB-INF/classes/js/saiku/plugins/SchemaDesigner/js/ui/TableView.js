/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The table view
 */
var TableView = Backbone.View.extend({
    className: 'dbtable',

    template: _.template(
        '<div class="table-wrapper" data-tabletype="empty" data-table="<%= obj.name %>">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th class="table-name truncate"><a class="table-config" href="#" hidden><i class="fa fa-cog"></i></a><%= obj.name %></th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<%= obj.columns %>' +
                '</tbody>' +
            '</table>' +
        '</div>'
    ),

    initialize: function(opts, args) {
        this.opts = opts;

        // Maintain `this`
        _.bindAll(this, 'render');

        this.draggable_attributes(args);
    },

    draggable_attributes: function(args) {
        var self = args;

        this.$el.draggable({
            appendTo    : 'body',
            cancel      : '.not-draggable',            
            cursor      : isFF ? '-moz-grabbing' : '-webkit-grabbing',
            cursorAt    : { top: 10, left: 35 },
            grid        : [ 15, 15 ],
            helper      : 'clone',
            opacity     : 0.60,
            placeholder : 'placeholder',
            revert      : 'invalid',
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

    render: function() {
        var outputHtml = this.template({name: this.opts.name, columns: this.opts.columns});
        this.$el.html(outputHtml);

        return this;
    }
});