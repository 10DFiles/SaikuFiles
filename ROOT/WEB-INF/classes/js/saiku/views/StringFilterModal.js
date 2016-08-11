/*  
 *   Copyright 2012 OSBI Ltd
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
 
/**
 * The "add a folder" dialog
 */
var StringFilterModal = Modal.extend({

    type: "filter",
    closeText: "Save",

    events: {
        //'submit form': 'save',
        'click .dialog_footer a' : 'call',
        'click .insert-member' : 'open_select_member_selector',
        'click .remove_row' : 'remove_row',
        'click .or' : 'add_text_box'
    },

    buttons: [
        { text: "Add", method: "save" },
        //{ text: "OK", method: "save" },
        { text: "Close", method: "update" },
        { text: "Help", method: "help" }
    ],

    message: "",

    expression_text: function() {
        var c = "<form class='form-group-inline' data-action='cad' id='custom_filter'><table border='0px'>";

        c += "<tr><td class='col1'><label>Select Level:<select class='levellist form-control'></select></label></td></tr>" +
             "<tr><td class='col1'><label>Match Type:<select class='form-control match_type'>" +

             "<option value='EQUALS'>Equal To</option>" +
             "<option value='NOTEQUAL'>Not Equal To</option>" +
             "<option value='LIKE'>Like</option>" +
             "<option value='NOTLIKE'>Not Like</option>" +
             "</select></label></td></tr>" +
             "<tr class='match_label'><td class='col1'><label>Match Text:<input class='form-control text_input'/></label><a href='#' class='or'>OR</a></td></tr>" +
             "</table><hr/>" +
             "<table class='existing_filters'>" +

             "</table>"+
             "</form>";
        return c;
    },

    expression: " ",
    expressonType: "",
    

    initialize: function(args) {
        var self = this;
        this.id = _.uniqueId('match-modal-');
        this.workspace = args.workspace;
        this.axis = args.axis;
        this.query = args.query;
        this.success = args.success;
        this.expression = args.expression;
        this.expressionType = args.expressionType;
        _.bindAll(this, "save", "expression_text");

        _.extend(this.options, {
            title: "Custom " + this.expressionType + " for " + this.axis
        });

        this.message = this.expression_text(this.expressionType);

        this.bind( 'open', function( ) {
            this.populate_select();
            this.populate_existing();
        });
        

        
        // fix event listening in IE < 9
        if(isIE && isIE < 9) {
            $(this.el).find('form').on('submit', this.save);    
        }

    },

    populate_select: function(){
        var axis = this.workspace.query.helper.getAxis(this.axis);

        $(axis.hierarchies).each(function(i, el) {
            var option = '';
            option += '<option value="'+el.name+'">'+el.name+'</option>';
            $(".levellist").append(option);

        });
    },

    populate_existing: function(){

        $(".existing_filters tr").remove();
        var axis = this.workspace.query.helper.getAxis(this.axis);


        _.each(axis.filters, function(filter, i){
            var matcher = "";
            if(filter.flavour === "NameLike" && filter.operator === "NOTEQUAL"){
                matcher = "Not Like";

            }
            else if(filter.flavour === "NameLike" && (filter.operator === "LIKE"||filter.operator === null)){
                matcher = "Like"
            }
            else if(filter.flavour === "Name" && (filter.operator === "EQUAL"||filter.operator === null)){
                matcher = "Equals"
            }
            else{
                matcher = "Does Not Equal"
            }

            var filterstring = "";
            var ex = filter.expressions;
            var first = "";
            var list = "";
            _.each(ex, function(el, i){
                if(i == 0) {
                    first = el;

                }
                else{
                    if(el!=first){
                        list += el+" OR ";
                    }
                }


            });

            list = list.substring(0, list.length - 3);
            var row = "<tr><td class='expr0'>"+filter.expressions[0]+"</td>" +
                "<td class='op' data-filter='"+filter.operator+"'>"+matcher+ "</td><td class='expr1' data-expr='"+filter.expressions+"'>"+list+"</td><td" +
                " class='remove_row'>x</td></tr>";
            $(".existing_filters").append(row);
        });

    },

    save: function( event ) {
        event.preventDefault( );
        var self = this;
        this.member = $(this.el).find('.levellist').find(":selected").val();
        this.matchtype = $(this.el).find('.match_type').find(":selected").val();
            this.expression = [];

            _.each($(this.el).find('.text_input'), function(el){
                if($(el).val()!="") {
                    self.expression.push($(el).val());
                }

            });
                self.success(this.member, this.matchtype, this.expression);
                this.populate_existing();
                $(".text_input").val("");
            //this.close();
        //}
        
        return false;
    },

    error: function() {
        $(this.el).find('dialog_body')
            .html("Could not add new folder");
    },

    help: function(){
        //TODO LINK TO PAGE
        window.open("http://wiki.meteorite.bi");
    },

    remove_row: function(event){
        event.preventDefault();
        var t = $(event.target);
        var axis = this.workspace.query.helper.getAxis(this.axis);
        var that = this;
        _.each(axis.filters, function(filter, i){
            var e = t.closest("tr").find('.expr1').data("expr");
            if(filter.expressions[0] === t.closest("tr").find('.expr0').html() &&
                filter.expressions.join() === e &&
                filter.operator === t.closest("tr").find('.op').data("filter")){
                axis.filters = axis.filters.splice(i+1, 1);
                that.populate_existing();
            }
        });
    },

    add_text_box: function(event){
        event.preventDefault();
        $('.match_label').parent().append("<tr class='match_label'><td class='col1'><label>Match Text:<input" +
            " class='text_input form-control'/></label><a href='#' class='or'>OR</a></td></tr>");
    },
    update: function(){

        this.close();
        this.workspace.query.run();


    }


});
