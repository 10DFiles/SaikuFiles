/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * The "table edit" dialog
 */
var TableEditModal = Modal.extend({
    type: 'table-edit',

    options: {
        autoOpen: false,
        modal: true,
        title: 'Table Edit',
        resizable: false,
        draggable: true
    },

    buttons: [
        { text: 'Assign Key', method: 'assign_key' },
        { text: 'Cancel', method: 'close' }
    ],

    events: {
        'click .dialog_footer a' : 'call',
    	'change #select-key'     : 'select_key'
    },
    
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);

        var tableName = this.dialog.tableData.tablename,
            cols = this.dialog.tableData.columns,
            selectedKeys;

        this.isKeys = this.dialog.mondrianSchema.get('physicalschema').tables.get(tableName);
        this.isKeys = this.isKeys.key.models[0];

        if (!(_.isEmpty(this.isKeys))) {
            var arrCols = this.isKeys.column.toJSON(),
                i = 0;
            selectedKeys = '';
            $(cols).each(function(key, value) {
                if (arrCols[i] !== undefined) {
                    if ($(value).text() === arrCols[i].name) {
                        var option = $(value).attr('selected', 'selected');
                        selectedKeys += $(option).outerHTML();
                        i++;
                    }
                    else {
                        selectedKeys += $(value).outerHTML();
                    }
                }
                else {
                    selectedKeys += $(value).outerHTML();
                }
            });
        }

        if (selectedKeys) {
            cols = { tablename: tableName, columns: selectedKeys };
        }
        else {
            cols = this.dialog.tableData;
        }

    	this.message = _.template(
			'<form class="form-group">' +
				'<label for="schema-name" class="i18n">Table Name: <b><%= obj.tablename %></b></label><br>' +
				'<label for="select-key" class="i18n">Select Key:</label>' +
				'<select id="select-key" multiple><%= obj.columns %></select>' +
			'</form>')(cols);

        this.bind('open');
    },

    slice_cols: function(num) {
        var cols = this.dialog.tableData.objCols,
            len = num,
            arr = [],
            i;

        for (i = 0; i < len; i++) {
            if (cols[i]) {
                arr.push(cols[i].name);
            }
        }

        return arr;
    },

    union_array: function(arr1, arr2) {
        var arr = _.union(arr1, arr2);

        if (arr.length > 4) {
            arr = _.first(arr, 4);
        }

        return arr;
    },

    select_key: function(event) {
        event.preventDefault();
        
        this.$el.find('.form-group .error').hide();

        var $currentTarget = $(event.currentTarget),
            tableName = this.dialog.tableData.tablename;

        this.vals = $currentTarget.val();
        this.table = this.dialog.mondrianSchema.get('physicalschema').tables.get(tableName);

        return false;
    },

    assign_key: function(event) {
    	event.preventDefault();

        if (this.vals) {
            var keyColumn = this.table.key;

            if (keyColumn.models.length === 0) {
                keyColumn.add(new MondrianTableKeyModel());

                var column = keyColumn.models[0].column;

                if (this.vals && !(_.isEmpty(this.vals))) {
                    var lenVals = this.vals.length,
                        i;

                    for (i = 0; i < lenVals; i++) {
                        column.add(new MondrianTableColumnModel({
                            id: this.vals[i],
                            name: this.vals[i]
                        }));
                    }
                }
            }
            else {
                var column = keyColumn.models[0].column,
                    objColumn = keyColumn.models[0].column.toJSON(),
                    lenColumn = keyColumn.models[0].column.length,
                    i;

                if (objColumn && !(_.isEmpty(objColumn))) {
                    for (i = 0; i < lenColumn; i++) {
                        column.remove(objColumn[i].name);
                    }
                }

                if (this.vals && !(_.isEmpty(this.vals))) {
                    var lenVals = this.vals.length,
                        j;

                    for (j = 0; j < lenVals; j++) {
                        column.add(new MondrianTableColumnModel({
                            id: this.vals[j],
                            name: this.vals[j]
                        }));
                    }
                }
            }

            this.dialog.$el.find('.workspace-canvas').find('.table-editor').hide();

            $.notify('Saved successfully', { globalPosition: 'top center', className: 'success' });

            this.$el.dialog('destroy').remove();
        }
        else if (!(_.isEmpty(this.isKeys))) {
            this.dialog.$el.find('.workspace-canvas').find('.table-editor').hide();

            $.notify('Saved successfully', { globalPosition: 'top center', className: 'success' });

            this.$el.dialog('destroy').remove();
        }
        else {

            this.dialog.$el.find('.workspace-canvas').find('.table-editor').hide();

            this.$el.dialog('destroy').remove();
        }

        var newCols = this.union_array(this.vals, this.slice_cols(4));

        newCols.push('...');

        // Trigger event when assign key
        Saiku.session.trigger('tableEditModal:assign_key', { 
            workspace: this,
            tableName: this.dialog.tableData.tablename,
            newCols: newCols,
            selectedKeys: this.vals
        });
    }
});