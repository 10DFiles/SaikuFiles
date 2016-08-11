/**
 * Created by bugg on 05/06/15.
 */

Saiku.ThemeEditor = {
    show_designer: function (admin) {
        if(ga!=undefined) {
            ga('send', 'event', 'ThemeEditor', 'Open');
        }
        return new ThemeEditor({admin: admin});
    }

}
var ImageM = Backbone.Model.extend({

    fileAttribute: 'file',
    //idAttribute: "image_type"
});

var Colors = Backbone.Model.extend({

});

var UISettings = Backbone.Model.extend({

});
var ThemeEditor = Backbone.View.extend({
    events: {
        'click .upload_image': 'upload_image',
        'click .save_colors' : 'save_colors'
    },

    template: _.template("<div><h3 class='i18n'>Change Look and Feel</h3>" +
            "<h4 class='i18n'>Logos</h4>"+
        "<form><label class='i18n'>Logo<br/>(166px x 28px PNG format):</label><input name='logo' type='file' id='LOGO'" +
        " class='restore_button'/><button class='upload_image i18n btn btn-primary'>Upload</button></form>" +
        "<form><label class='i18n'>Large Icon<br/>(32px x 32px PNG):</label><input name='large_icon' type='file' id ='LOGO_32' class='restore_button'/><button class='upload_image btn btn-primary'>Upload</button></form>" +
        "<form><label class='i18n'>Small Icon<br/>(16px x 16px PNG):</label><input name='small_icon' id='ICON_16' type='file'" +
        " class='restore_button'/><button class='i18n upload_image btn btn-primary'>Upload</button></form><br/>" +
        "<h4 class='i18n'>Colors</h4>"+
        "<form>"+
        "<div><label class='i18n'>Toolbar Gradient From:<input type='text' id='toolbar_from_color' /></label><br/>"+
        "<label class='i18n'>Toolbar Gradient To:<input type='text' id='toolbar_to_color' /></label></div>"+
        "<div><label class='i18n'>Tab Bar Background:<input type='text' id='tabs_color' /></label><br/>"+
        //"<label>Tabs UL:<input type='text' id='tabs_ul_color' /></label>"+
        "<label class='i18n'>Unselected Tab Color:<input type='text' id='tabs_li_color' /></label><br/>"+
        //"<label>Tabs LI Color:<input type='text' id='tabs_li_color2' /></label>"+
        "<label class='i18n'>Selected Tab Gradient From Color:<input type='text' id='tabs_li_selected_color' /></label><br/>"+
        "<label class='i18n'>Selected Tab Gradient To Color:<input type='text' id='tabs_li_selected_to_color' /></label>"+
        "</div><button class='save_colors i18n'>Save Colors</button></form>"+
        "</div>"),

    upload_image: function(event){
        event.preventDefault();
        var button = $(event.currentTarget);
        var file = button.closest('form').find("input[type='file']")[0].files[0];
        var type = button.closest('form').find("input[type='file']").attr('id');

        var schema = new ImageM({'image_type':type});
        schema.set('file', file);

        schema.url = 'info/ui-settings/image';

        schema.save();
    },
    save_colors: function(event){
        event.preventDefault();
        var c1 = $(this.el).find("#toolbar_from_color").spectrum("get").toHexString();
        var c2 = $(this.el).find("#toolbar_to_color").spectrum("get").toHexString();
        var c3 = $(this.el).find("#tabs_color").spectrum("get").toHexString();
        //var c4 = $(this.el).find("#tabs_ul_color").spectrum("get").toHexString();
        var c5 = $(this.el).find("#tabs_li_color").spectrum("get").toHexString();
        //var c6 = $(this.el).find("#tabs_li_color2").spectrum("get").toHexString();
        var c7 = $(this.el).find("#tabs_li_selected_color").spectrum("get").toHexString();
        var c8 = $(this.el).find("#tabs_li_selected_to_color").spectrum("get").toHexString();


        var colors = new Colors({'color-toolbar':c1,
            'color-toolbar-to': c2,
            'color-tabs': c3,
            //'color-tabs-ul': c4,
            'color-tabs-li' : c5,
            //'color-tabs-li-color' : c6,
            'color-tabs-li-selected' : c7,
            'color-tabs-li-selected-to' :c8});
        colors.url = 'info/ui-settings/color';

        colors.save({success:function(){
            location.reload();
        }});

    },
    initialize: function (options) {
        this.options = options;
        this.uisettings = new UISettings();
        this.uisettings.url = 'info/ui-settings';
        var self = this;
        this.uisettings.fetch({success: function(){
            self.render();
        }});



    },
    el: '.user_info',
    render: function () {
       $(this.el).html(this.template());
        $(this.el).find("#toolbar_from_color").spectrum({
            color: (this.uisettings.get("color-toolbar") == undefined) ? "#EEEEEE" : this.uisettings.get("color-toolbar").replace(/;/g, '')
        });
        $(this.el).find("#toolbar_to_color").spectrum({
            color: this.uisettings.get("color-toolbar-to") == undefined ? "#DDDDDD" : this.uisettings.get("color-toolbar-to").replace(/;/g, '')
        });
        $(this.el).find("#tabs_color").spectrum({
            color: this.uisettings.get("color-tabs") == undefined ? "#F5F5F5" : this.uisettings.get("color-tabs").replace(/;/g, '')
        });
        /*$(this.el).find("#tabs_ul_color").spectrum({
            color: this.uisettings.get("color-tabs-ul") == undefined ? "#F8F8F8" : this.uisettings.get("color-tabs-ul").replace(/;/g, '')
        });*/
        $(this.el).find("#tabs_li_color").spectrum({
            color: this.uisettings.get("color-tabs-li") == undefined ? "#F2F2F2" : this.uisettings.get("color-tabs-li").replace(/;/g, '')
        });
        /*$(this.el).find("#tabs_li_color2").spectrum({
            color: this.uisettings.get("color-tabs-li-color") == undefined ? "#888" : this.uisettings.get("color-tabs-li-color").replace(/;/g, '')
        });*/
        $(this.el).find("#tabs_li_selected_color").spectrum({
            color: this.uisettings.get("color-tabs-li-selected") == undefined ? "#FFFFFF" : this.uisettings.get("color-tabs-li-selected").replace(/;/g, '')
        });
        $(this.el).find("#tabs_li_selected_to_color").spectrum({
            color: this.uisettings.get("color-tabs-li-selected-to") == undefined ? "#F0F0F0" : this.uisettings.get("color-tabs-li-selected-to").replace(/;/g, '')
        });
        Saiku.i18n.translate();
    }
});

Saiku.events.bind('admin:loaddatasources', function(admin) {
    var m = null;
    $(admin.admin.el).find('.themelist').remove();
    $(admin.admin.el).find('.theme').remove();

    var $link = $("<a />")
        .attr({
            href: "#",
            title: "Edit Theme"
        })
        .click(function () {
            if (m != null) {
                m.remove();
                m.unbind();
                m = null;
                $(admin.admin.el).find(".workspace_results").append("<div class='user_info'></div>")
            }
            m = Saiku.ThemeEditor.show_designer(admin)
        }).text("Edit Theme")
        .addClass('source');
    var $li = $("<li />").append($link);
    $(admin.admin.el).find('#queries:last').append("<li class='theme'><strong>Theme</strong>" +
        "<ul class='themelist'></ul></ul>");
    $(admin.admin.el).find('.themelist').append($li);


})