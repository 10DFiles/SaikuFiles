/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2015
 */

/**
 * Embed Link
 */
var EmbedLink = Backbone.View.extend({
	initialize: function(args) {
		// Keep track of parent workspace
		this.workspace = args.workspace;

		// Base URL
        this.BASE_URL = 'js/saiku/plugins/EmbedLink/';

		// Add button in workspace toolbar
		this.add_button();
	},

	add_button: function() {
		var button =
			$('<a href="#embedLink" class="embedLink button disabled_toolbar i18n" title="Embed Link"></a>')
			.css({ 'background-image': 'url("' + this.BASE_URL + 'image/plugin.png")',
				   'background-repeat': 'no-repeat',
				   'background-position': '50% 50%',
				   'background-size': '16px'
				});

		var $li = $('<li class="seperator"></li>').append(button);
		this.workspace.toolbar.$el.find('ul').append($li);
		this.workspace.toolbar.embedLink = this.show;
	},

	show: function(event) {
		event.preventDefault();
		(new EmbedLinkModal({workspace:this.workspace})).render().open();
	}
});

 /**
  * Start Plugin
  */
Saiku.events.bind('session:new', function() {
	Saiku.loadCSS('js/saiku/plugins/EmbedLink/css/plugin.css');	
	Saiku.loadJS('js/saiku/plugins/EmbedLink/js/EmbedLinkModal.js');

	function new_workspace(args) {
		if (typeof args.workspace.embedLink === 'undefined') {
			args.workspace.embedLink = new EmbedLink({ workspace: args.workspace });
		}
	}

	// Add new tab content
	for (var i = 0, len = Saiku.tabs._tabs.length; i < len; i++) {
		var tab = Saiku.tabs._tabs[i];
		new_workspace({
			workspace: tab.content
		});
	}

	// New workspace
	Saiku.session.bind('workspace:new', new_workspace);
});
