/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

var DBConnectionsCollection = Backbone.Collection.extend({
    model: DBConnectionModel
});

var DBConnectionModel = Backbone.Model.extend({
    url: 'api/database',

    initialize: function(args, opts) {
        this.dbs = new DatabasesCollection(null, { dialog: opts.dialog });
        this.dbs.parent = this;

        if (opts && opts.dialog) {
            this.dialog = opts.dialog;
        }
    },
    parse: function(res) {
        var len = res.databases.length,
            i;

        for (i = 0; i < len; i++) {
            this.dbs.add(new DatabaseModel({
                id: res.databases[i], 
                name: res.databases[i]
            }, { dialog: this.dialog }));
        }

        // if (this.dialog) {
        //     console.log(this.dialog);
        //     console.log(res);
        //     this.dialog.populate({ 
        //         clear: true, 
        //         attribute: '.database-list', 
        //         repository: res 
        //     }, this.dialog.database_objects);
        // }

        if (this.dialog) {
            // console.log(this.dialog);
            // console.log(res);
            this.dialog.populate_dbs(res);
        }

        return res;
    }
});

var DatabasesCollection = Backbone.Collection.extend({
    model: DatabaseModel
});

var DatabaseModel = Backbone.Model.extend({
    url: function() {
        return 'api/database/' + this.get('name');
    },

    initialize: function(args, opts) {
        this.schemas = new DBSchemasCollection(null, { dialog: opts.dialog });
        this.schemas.parent = this;

        if (opts && opts.dialog) {
            this.dialog = opts.dialog;
        }
    },

    parse: function(res) {
        var len = res.schema.length,
            i;

        for (i = 0; i < len; i++) {
            this.schemas.add(new DBSchemaModel({
                id: res.schema[i].name, 
                catalog: res.schema[i].catalog
            }, { 
                dialog: this.dialog, 
                database: this.get('name') 
            }));
        }

        // if (this.dialog) {
        //     this.dialog.populate({ 
        //         clear: true, 
        //         attribute: '.schema-list', 
        //         repository: res 
        //     }, this.dialog.schema_objects);
        // }

        if (this.dialog) {
            this.dialog.populate_schema(res);
        }

        return res;
    }
});

var DBSchemasCollection = Backbone.Collection.extend({
    model: DBSchemaModel
});

var DBSchemaModel = Backbone.Model.extend({
    url: function() {
        return 'api/database/' + this.parentDB + '/' + this.id;
    },

    initialize: function(args, opts) {
        this.parentDB = opts.database;
        this.tables = new TablesCollection(null, { dialog: opts.dialog });
        this.tables.parent = this;

        if (opts && opts.dialog) {
            this.dialog = opts.dialog;
        }
    },

    parse: function(res) {
        var len = res.tables.length,
            i;

        for (i = 0; i < len; i++) {
            this.tables.add(new TableModel({
                id: res.tables[i], 
                name: res.tables[i]
            }, { 
                dialog: this.dialog, 
                schema: this.id, 
                database: this.parentDB 
            }));
        }

        return res;
    }

});

var TablesCollection = Backbone.Collection.extend({
    model: TableModel,

    toJSON: function() {
        return this.map(function(model) { 
            return model.toJSON(); 
        });
    }
});

var TableModel = Backbone.Model.extend({
    url: function() {
        return 'api/database/' + this.parentDB + '/' + this.parentSchema + '/' + this.get('name');
    },

    initialize: function(args, opts) {
        this.parentDB = opts.database;
        this.parentSchema = opts.schema;
        this.columns = new ColumnsCollection(null, { dialog: opts.dialog });
        this.columns.parent = this;

        this.fetch();

        if (opts && opts.dialog) {
            this.dialog = opts.dialog;
        }
    },

    parse: function(res) {
        var len = res.column.length,
            i;

        for (i = 0; i < len; i++) {
            this.columns.add(new ColumnModel({
                id: res.column[i].id, 
                name: res.column[i].name, 
                type: res.column[i].type, 
                nullable: res.column[i].nullable
            }, { 
                schema: this.parentSchema, 
                database: this.parentDB, 
                table: this.name 
            }));
        }

        if (this.dialog) {
            this.dialog.populate_tables({ 
                clear: false, 
                attribute: '.table-list', 
                repository: this,
                dialog: this.dialog 
            }, this.dialog.args.table_objects);
        }

        return res;
    },

    toJSON: function() {
        return _.clone(this.attributes);
    }
});

var ColumnsCollection = Backbone.Collection.extend({
    model: ColumnModel,

    toJSON2: function() {
        return this.map(function(model) { 
            return model.toJSON2(); 
        });
    }
});

var ColumnModel = Backbone.Model.extend({
    initialize: function(args, opts) {
        this.parentSchema = opts.schema;
        this.parentDB = opts.database;
        this.parentTable = opts.table;
    },

    toJSON2: function() {
        return _.clone(this.attributes);
    }
});
