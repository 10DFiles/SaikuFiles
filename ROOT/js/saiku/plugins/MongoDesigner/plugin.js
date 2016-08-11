/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2014
 */
Saiku.MongoDesigner = {
    show_designer: function (admin) {
        if(ga!=undefined) {
            ga('send', 'event', 'MongoDesigner', 'Open');
        }
        return new MongoDesigner({admin: admin});
    },
    load_schema: function(admin,schema){
        return  new MongoDesigner({admin: admin, schema: schema})
    }
}

var MongoDesigner = Backbone.View.extend({

    events: {
        'click .create_mongo_datasource' : 'save_datasource',
        'click .update_mongo_datasource' : 'update_datasource',
        'click .remove_mongo_datasource' : 'remove_datasource',
        'click .refresh_mongo_datasource' : 'refresh_datasource',
        'click #connect' : 'connect',
        'click .addrow' : 'add_row',
        'click #addtable' : 'add_table',
        'click .remove_row' : 'remove_row',
        'click .mongoschemaitem' : 'show_schema'
    },
    initialize: function (options) {
        this.options = options;
        this.connection = new MongoConnection();
        this.collections = new MongoCollections({}, { dialog: this });


        var that = this;
        if(this.options.schema!=null){
            var p = encodeURIComponent(this.options.schema.get("name"));
            this.editschema = new MongoSchema({id:p});
            this.editschema.fetch({success:function(){
                that.render();
            }});
        }
        else{
            this.render();
        }
    },
    template: _.template("<div><h3 class='i18n'>Create Mongo Source</h3><br/><form id='connectform'>" +
    "<div><form>" +
    "<div class='form-group'><label for='schemaname' class='i18n'> Schema Name:</label>" +
    "<input class='form-control' name='schemaname' id='schemaname' value='<%= schema.name %>' " +
    "<% if(schema.id){%>" + "disabled" + "<%}%>" +
    "/></div><br/>" +
    "<div class='form-group'><label for='hostinput' class='i18n'>Mongo Hostname:</label>" +
    "<input name='hostinput' class='i18n form-control' id='hostinput' value='<%= schema.host %>'/></div><br/>" +
    "<div class='form-group'><label for='databaseinput' class='i18n'>Mongo Database:</label>" +
    "<input id='databaseinput' class='i18n form-control' name='databaseinput' value='<%= schema.database %>'/></div><br/>" +
    "</form><a href='#' id='addtable' class='i18n btn btn-primary' style='margin-bottom:20px;'>Add Table</a>" +
    "<div id='tables'> " +
    "<% _.each(schema.tables, function(post){ %>"+
    "<div class='tablerow'><label for='mongokey' class='i18n'>Table Name:</label><input name='mongotable' class='mongotable form-control' value='<%= post.name %>'/><br/>" +
    "<label for='collectioninput' class='i18n'>Mongo Collection:</label><input name='collectioninput' class='collectioninput form-control' value='<%= post.collection %>'><br/>" +
    "<a href='#' class='addrow i18n btn btn-primary' style='margin-bottom:20px;'>Add Row</a>" +
    "<div class='keys'>" +
    "<% _.each(post.map, function(key){ %>"+
    "<div class='keyrow'><label for='mongokey' class='i18n'>Mongo Key:</label><input name='mongokey' class='mongokey form-control' value='<%= key.mongokey %>'/>" +
    "<label for='colname' class='i18n'>SQL Column Name:</label><input name='colname' class='colname form-control' value='<%= key.colname %>'/>" +
    "<label for='datatype' class='i18n'>Data Type:</label>" +
    "<select class='datatype form-control'>" +
    "<option value='varchar(250)' " +
    "<% if(key.fieldtype == 'varchar(250)'){%>" + "selected" + "<%}%>" +
    ">Varchar</option>" +
    "<option value='integer' " +
    "<% if(key.fieldtype == 'integer'){%>" + "selected" + "<%}%>" +
    ">Integer</option>" +
    "<option value='bigint' " +
    "<% if(key.fieldtype == 'bigint'){%>" + "selected" + "<%}%>" +
    ">Big Int</option>" +
    "<option value='decimal(10,4)' " +
    "<% if(key.fieldtype == 'decimal(10,4)'){%>" + "selected" + "<%}%>" +
    ">Decimal</option>" +
    "<option value='date' " +
    "<% if(key.fieldtype == 'date'){%>" + "selected" + "<%}%>" +
    ">Date</option>" +
    "<option value='timestamp' " +
    "<% if(key.fieldtype == 'timestamp'){%>" + "selected" + "<%}%>" +
    ">Timestamp</option>" +
    "<option value='boolean' " +
    "<% if(key.fieldtype == 'boolean'){%>" + "selected" + "<%}%>" +
    ">Boolean</option>" +
    "</select><a href='#x' class='remove_row'><strong>X</strong></a></div>" +
    "<% }); %>" +
    "</div></div>"+
    "<% }); %>" +
    "</div>" + "<br/>" +
    "<% if(schema.id){ %>" +
    "<a href='#' id='refresh' title='<%=schema.name%>' class='user_button form_button refresh_mongo_datasource i18n btn btn-primary'>Refresh</a>" +
    "<a href='#' id='remove' title='<%=schema.name%>' class='user_button form_button remove_mongo_datasource btn btn-primary" +
        " i18n'>Remove</a>" +
    "<a href='#' id='update' title='<%=schema.name%>' class='user_button form_button update_mongo_datasource i18n btn btn-primary'>Save</a></div>" +
    "<% } else {%>" +
    "<a href='#' class='user_button form_button create_mongo_datasource i18n btn btn-primary'>Save</a></div>" +
    "<% } %>" +
    "<div id='savestatus'></div>"),

    rowtemplate: _.template("<div class='keyrow form-inline'><label for='mongokey'>Mongo Key:</label><input name='mongokey' class='mongokey form-control'/>" +
    "<label for='colname' class='i18n'>SQL Column Name:</label><input name='colname' class='colname form-control'/>" +
    "<label for='datatype' class='i18n'>Data Type:</label><select class='datatype form-control'>" +
    "<option value='varchar(250)'>Varchar</option>" +
    "<option value='integer'>Integer</option>" +
    "<option value='bigint'>Big Int</option>" +
    "<option value='decimal(10,4)'>Decimal</option>" +
    "<option value='date'>Date</option>" +
    "<option value='timestamp'>Timestamp</option>" +
    "<option value='boolean'>Boolean</option>" +
    "</select><a href='#x' class='remove_row'><strong>X</strong></a></div>"),
    tabletemplate: _.template("<div class='tablerow'><label for='mongokey'>Table Name:</label><input name='mongotable' class='mongotable form-control'/><br/>" +
    "<label for='collectioninput' class='i18n'>Collection:</label><input name='collectioninput' class='collectioninput form-control'><br/>" +
    "<a href='#' class='addrow btn btn-primary' style='margin-bottom:20px;'>Add Row</a>" +
    "<div class='keys'></div>" +
    "</div>"),
    el: '.user_info',
    render: function () {
        var json = "";
        if(this.editschema!=undefined){
            json = this.editschema.toJSON();
        }
//        var t= $(this.template(json)).find('#tables').append(this.tabletemplate)

        $(this.el).html(this.template({schema: json}));
        Saiku.i18n.translate();
    },


    save_datasource : function(isUpdate){
        var schema;
        if(ga!=undefined) {
            ga('send', 'event', 'MongoDesigner', 'Save');
        }
        if (typeof isUpdate === 'boolean' && isUpdate == true ) {
            // Use existing MongoSchema
            schema = this.editschema;
            // Resets the tables collections
            schema.tables.reset();
        }
        else {
            schema = new MongoSchema();
        }

        $(this.el).find('#tables').children().each(function(){
            var table = new MongoTable({name: $(this).find(".mongotable").val()});
            table.set({collection:$(this).find('.collectioninput').val()});
            $(this).find('.keys').children().each(function(){
                var k = $(this).find(".mongokey").val();
                var t = $(this).find(".datatype").val();
                var c = $(this).find(".colname").val();

                var map = new Mapping({mongokey:k, fieldtype:t, colname:c});
                table.map.add(map);
            });

            schema.tables.add(table);
        });

        // Check for empty table set.
        if(schema.tables.length < 1){
            alert("Please add at least one table.");
            return;
        }

        // Check for empty tables without rows
        for(i=0; i < schema.tables.length; i++){
            if(schema.tables.at(i).map.length < 1){
                alert("Please add at least one row to each table.");
                return;
            }
        }

        var form = $(this.el).find('#connectform');


        schema.set({name:$(this.el).find('#schemaname').val()});
        schema.set({host: $(form).find('#hostinput').val()});
        schema.set({database:$(form).find('#databaseinput').val()});

        var self = this;

        schema.save({}, {
            data : JSON.stringify(schema.toJSON()),
            contentType : "application/json",
            success : function() {
                //this.mongoSchema.add(schema)
                Saiku.events.trigger('admin:loaddatasources', {
                    admin: self.options.admin.admin
                });

                $(self.el).find('.user_info').html("");
            },
            error : function(data, xhr) {
                $(self.el).find('#savestatus').html("Save failed!<br/>(" + xhr.responseText + ")");
            }
        });
    },

    update_datasource: function(event){
        event.preventDefault();

        this.save_datasource(true);
    },

    remove_datasource: function(event){
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);


        var self = this;

        this.editschema.destroy({
            wait: true,
            success: function () {
                self.populate_datasources();
                $(self.el).find('.user_info').html("");

            }
        });
    },
    connect : function(){
        var form = $(this.el).find('#connectform');

        var host = $(form).find('#hostinput').val();
        if(host == ""){
            host = null;
        }
        var database = $(form).find('#databaseinput').val();

        this.connection.set({host: host, database: database});

        this.connection.save({}, {data: JSON.stringify(this.connection.attributes), contentType: "application/json", success:this.collections.fetch()});
    },
    populate: function(vars){
        var that = this;
        _.forEach(vars, function (collection) {
            $(that.el).find('#collectioninput')
                .append($("<option></option>")
                    .attr("value",collection)
                    .text(collection));
        });
    },

    add_row: function(event){
        event.preventDefault();

        $(event.target).parent().find('.keys').append(this.rowtemplate);
    },
    add_table: function(event){
        event.preventDefault();
        $(this.el).find('#tables').append(this.tabletemplate);
    },
    remove_row: function(event){
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);

        var parent = $currentTarget.parent();
        parent.remove();
    },
    show_schema : function(event){
        alert("hello");
    }
});
Saiku.events.bind('admin:viewdatasource', function(admin){
    $(admin.admin.el).find("select[name='drivertype']").append($("<option></option>").attr("value","MONGO").text("Mongo"));

});
Saiku.events.bind('admin:loaddatasources', function(admin){
    var m = null;
    $(admin.admin.el).find('.mongolist').remove();
    var $link = $("<a />")
        .attr({
            href: "#",
            title: "Mongo Source"
        })
        .click(function(){
            if(m!=null){
                m.remove();
                m.unbind();
                m = null;
                $(admin.admin.el).find(".workspace_results").append("<div class='user_info'></div>")
            }
            m = Saiku.MongoDesigner.show_designer(admin)
        }).text("Add Mongo Source")
        .addClass('source');
    var $li = $("<li />").append($link);


    $(admin.admin.el).find('#queries .dslist:last').after("<ul class='dslist mongolist'><strong>Mongo Schema</strong><ul class='mongoschema'></ul></ul>");
    $(admin.admin.el).find('.mongoschema').append($li);

    var schema = new MongoSchemasList();
    schema.fetch({success: function(){
        schema.each(function(item){

            var $link = $("<a />")
                .attr({
                    href: "#",
                    title: item.get("name")
                })
                .click(function(){
                    Saiku.MongoDesigner.load_schema(admin, item)
                }).text(item.get("name"))
                .addClass('source');
            var $li = $("<li />").append($link).addClass("mongosource");
            $(admin.admin.el).find(".mongoschema").append($li);


        });

    }});


});


var MongoConnection = Backbone.Model.extend({
    defaults :{
        host: null,
        port: null,
        username: null,
        password: null,
        database: null,
        userdatabase: null
    },
    url: "api/mongo"
});

var MongoCollection = Backbone.Model.extend({

});
var MongoCollections = Backbone.Collection.extend({
    model: MongoCollection,
    url: "api/mongo/collections",
    initialize: function (args, options) {
        if (options && options.dialog) {
            this.dialog = options.dialog;
        }
    },

    parse: function (response) {
        if (this.dialog) {
            this.dialog.populate(response);
        }
        return response;
    }

});

var MongoSchema = Backbone.Model.extend({
    url : function() {
        var base = 'api/mongo/schema';
        if (this.isNew()) return base;
        return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
    },
    defaults:{
        name: "",
        host: null,
        database: null,
        id: null
    },
    initialize: function() {
        this.tables = new MongoTables();
        this.tables.parent = this;
    },
    parse: function(response){
        console.log(response);
        this.tables = new MongoTables();
        this.tables.add(response.tables);
        if(response.tables!=null){
            for(var i=0; i<response.tables.length; i++) {
                var t = response.tables[i];
                var table = this.tables.get(t.name);
                table.map = new Mappings(response.tables[i].map);


            }
        }
        return response;

    },
    toJSON : function(){
        var attr = _.clone(this.attributes);
        attr.tables = this.tables.toJSON();
        return attr;
    }

});

var MongoSchemas = Backbone.Collection.extend({
    url : 'api/mongo/schema',
    model: MongoSchema

});

var MongoSchemaList = Backbone.Model.extend({
});

var MongoSchemasList = Backbone.Collection.extend({
    url : 'api/mongo/schema',
    model: MongoSchemaList
});

var MongoTable = Backbone.Model.extend({
    idAttribute: "name",
    defaults:{
        name: "",
        type: "view",
        collection: null
    },
    initialize: function(){
        this.map = new Mappings();
        this.map.parent = this;
    },
    toJSON : function(){
        var attr = _.clone(this.attributes);
        attr.map = this.map.toJSON();
        return attr;
    }
});

var MongoTables = Backbone.Collection.extend({
    model: MongoTable
});

var Mapping = Backbone.Model.extend({
    defaults:{
        mongokey: "",
        fieldtype: "",
        colname: ""
    },
    toJSON : function(){
        var attr = _.clone(this.attributes);
        return attr;
    }
});

var Mappings = Backbone.Collection.extend({
    model: Mapping
});

Saiku.events.bind('admin:changedriver', function(options){
    var div = options.div;
    var type = options.type;

    switch(type) {
        case "MONGO":
            var schema = new MongoSchemasList();
            schema.fetch({success: function(){
                schema.each(function(item){

                    $(div).find("select[name='mongoschema']").append($("<option></option>")
                        .attr("value",item.get("name"))
                        .text(item.get("name")));

                });

            }});
            console.log("MONGO");
            $(div).find('input[name="connusername"]').hide();
            $(div).find('input[name="connpassword"]').hide();
            $(div).find('input[name="driver"]').hide();
            $(div).find('input[name="jdbcurl"]').hide();
            $(div).find('label[for="connusername"]').hide();
            $(div).find('label[for="connpassword"]').hide();
            $(div).find('label[for="driver"]').hide();
            $(div).find('label[for="jdbcurl"]').hide();
            $(div).find('select[name="drivertype"]').after('<div class="mongoel"><br/><label for="mongoschema">Mongo Schema</label><select name="mongoschema"></select></div>')
            break;
        default:
            $(div).find('.mongoel').remove();
    }
});
