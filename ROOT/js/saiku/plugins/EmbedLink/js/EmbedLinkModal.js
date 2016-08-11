/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2015
 */

/**
 * Embed Link modal
 */
var EmbedLinkModal = Modal.extend({
    type: 'embed-link',

	buttons: [
		{ text: 'Close', method: 'close' }
	],

	events: {
		'click  .dialog_footer a'               : 'call',
		'click input[name="type-mode"]:checked' : 'update_link'
	},

    initialize: function(args) {
		// Initialize properties
        this.options.title = 'Embed Link';
		this.workspace = args.workspace;
		this.fileName = this.workspace.query.name || this.workspace.query.attributes.name || this.workspace.query.attributes.file;
		this.embedType = this.workspace.query.getProperty('saiku.ui.render.mode');

		if (Settings.BIPLUGIN5) {
		}
		else {
			this.textContent = '<iframe src="' + Settings.BASE_URL + '?mode=' + this.embedType + '&plugin=true#query/open/' + this.fileName + '"></iframe>';
		}
		
		if (this.fileName) {
			this.message = '<p>Select an option:</p>' +
				'<label><input type="radio" name="type-mode" id="mode-table" value="table"> Table mode</label><br>' +
				'<label><input type="radio" name="type-mode" id="mode-chart" value="chart" checked> Chart mode</label><br>' +
				'<label><input type="radio" name="type-mode" id="mode-map" value="map" disabled> Map mode <i>(Save the query in map mode)</i></label><br>' +
				'<textarea id="text-content">' + this.textContent + '</textarea>';
		}
		else {
			this.message = '<h3 style="color: red;">Please save your query first!</h3>';
		}

        this.bind('open', function() {
    		this.post_render();
    		this.$el.find('#mode-' + this.embedType).prop('checked', true);
    		if (this.embedType === 'map') {
				this.$el.find('#mode-map').prop('disabled', false);
    		}
        });
    },

    post_render: function() {
        var tPerc = (((($('body').height() - 300) / 2) * 100) / $('body').height());
        var lPerc = (((($('body').width() - 550) / 2) * 100) / $('body').width());

        this.$el.dialog('option', 'position', 'center');
        this.$el.parents('.ui-dialog').css({ 
            width: '550px', 
            top: tPerc + '%', 
            left: lPerc + '%' 
        });
    },

	update_link: function() {
		this.embedType = this.$el.find('input:radio[name=type-mode]:checked').val();
		this.generate_content();
	},

	generate_content: function() {
		this.textContent = '<iframe src="' + Settings.BASE_URL + '?mode=' + this.embedType + '&plugin=true#query/open/' + this.fileName + '"></iframe>';
		this.$el.find('#text-content').val(this.textContent);
	}
});
