/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

/**
 * Class that receives a JavaScript code that can render within a dashboard widget
 *
 * @class
 * @chainable
 * @return {SaikuPlaygroundRenderer} The SaikuPlaygroundRenderer instance (for chaining)
 */
var SaikuPlaygroundRenderer = (function() {
	'use strict';

	var CONST = {
		IDPANEL: ''
	};

	/**
	 * That constructor enforces the use of new, even if you call the constructor like a function
	 *
	 * @constructor
	 * @private
	 * @param  {Object} data Saiku data
	 * @param  {Object} opts Options with values of htmlObject, uri's and others things
	 */
	function SaikuPlaygroundRenderer(data, opts) {
		// enforces new
		if (!(this instanceof SaikuPlaygroundRenderer)) {
			return new SaikuPlaygroundRenderer(data, opts);
		}
		
		this._data = data;
		this._options = opts;
		this._options.htmlObject = this._options.htmlObject.replace('#', '');
		this._timer = this._options.uris ? (this._options.uris.length * 1000) : 1000;

		$('#' + this._options.htmlObject).block({
			message: '<span class="saiku_logo" style="float:left">&nbsp;&nbsp;</span> Executing....'
		});

		var saikuChartRenderer = new SaikuChartRenderer(null, {});
		var dataTree = saikuChartRenderer.process_data_tree({ data: this._data }, true, true);

		this._data = processData(dataTree);

		externalLoadJS(this._options.uris);

		CONST.IDPANEL = this._options.htmlObject;

		// console.log(this);
	}

	/**
	 * Method for organizing Saiku data
	 *
	 * @method processData
 	 * @private
	 * @param  {Object} data Saiku data
	 * @return {Object} ROWS, COLS, TOTALS of Saiku data
	 */
	function processData(data) {
		var newData = {
			ROWS: [],
			COLS: [],
			TOTALS: []
		};

		// Populate Rows
		for (var i = 0, iLen = data.resultset.length; i < iLen; i++) {
			var nameRaw = '';
			var dataRaw = [];
			for (var j = 0, jLen = data.resultset[i].length; j < jLen; j++) {
				if (_.isString(data.resultset[i][j])) {
					if (_.isEmpty(nameRaw)) {
						nameRaw = data.resultset[i][j];
					}
					else {
						nameRaw += ' ~ ';
						nameRaw += data.resultset[i][j];
					}
				}
				else {
					// TODO: Numbers with this format "32,00" return NaN
					if (_.isObject(data.resultset[i][j]) && _.has(data.resultset[i][j], 'f')) {
						dataRaw.push(Number(data.resultset[i][j].f));
					}
				}
			}
			newData['ROWS'].push({ name: nameRaw, data: dataRaw });
		}

		// Populate Cols
		for (var i = 0, len = data.metadata.length; i < len; i++) {
			newData['COLS'].push(data.metadata[i].colName);
		}

		// Populate Totals			
		_.each(data, function(value, key, list) {
			if (key !== 'height' && key !== 'metadata' && key !== 'resultset' && key !== 'width') {
				newData['TOTALS'].push({ name: key, data: value });
			}
		});
		
		// console.log(newData);

		return newData;
	}

	/**
	 * Replaced code with new syntax
	 *
	 * @method replaceCode
 	 * @private
	 * @param  {Object} data Saiku data
	 * @param  {String} code external code
	 * @return {String} New external code
	 */
	function replaceCode(data, code) {
		var data = data;
		var objChart = {};
		var namePropertyData = [];
		var namePropertyChart = [];
		var newData = [];
		var namePropertyValue;
		var arrTpl;

		code = code.replace(/{(\w+)}/g, function(m, p) {
			arrTpl = p.split('_');
			if (p === 'IDPANEL') { // '{IDPANEL}' => String
				return CONST[p];
			}
			else if (m.indexOf('ROWS') !== -1 && m.indexOf('VALUES') !== -1) { // {ROWS_name|data_VALUES} => Array
				newData = [];
				namePropertyValue = p.split('_')[1];

				for (var i = 0, len = data['ROWS'].length; i < len; i++) {
					newData.push(data['ROWS'][i][namePropertyValue]);
				}

				// console.log(newData);

				return JSON.stringify(newData);
			}
			else if (m.indexOf('COLS') !== -1 && m.indexOf('VALUES') !== -1) { // {COLS_name_VALUES} => Array
				newData = [];

				for (var i = 0, len = data['COLS'].length; i < len; i++) {
					newData.push(data['COLS'][i]);
				}

				// console.log(newData);

				return JSON.stringify(newData);
			}
			else if (m.indexOf('ROWS') !== -1 && m.indexOf('EMPTY') !== -1) { // {ROWS_name_data_EMPTY_name_data} => Object
				newData = [];
				namePropertyData = p.split('_EMPTY_')[1];
				namePropertyData = namePropertyData.split('_');

				for (var i = 0, iLen = arrTpl.length; i < iLen; i++) {
					if (arrTpl[i] !== 'ROWS') {
						if (arrTpl[i] !== 'EMPTY') {
							namePropertyChart.push(arrTpl[i]);
							objChart[arrTpl[i]] = '';
						}
						else {
							i = arrTpl.length;
						}
					}
				}

				for (var j = 0, jLen = data['ROWS'].length; j < jLen; j++) {
					for (var k = 0, kLen = namePropertyChart.length; k < kLen; k++) {
						objChart[namePropertyChart[k]] = data['ROWS'][j][namePropertyData[k]];
					}
					var newObjChart = _.clone(objChart);
					newData.push(newObjChart);
				}

				// console.log(newData);

				return JSON.stringify(newData);
			}
			else {
				return '';
			}
		});

		// console.log(code);

		return code;
	}

	/**
	 * Load a JS file asynchronously
	 *
	 * @method loadJS
 	 * @private
	 * @param  {String}   src File path
	 * @param  {Function} callback Execute a function
	 * @return {String}   Inject script in HTML DOM
	 */
    function loadJS(src, callback) {
        var scriptNode = window.document.createElement('script'),
            ref = window.document.getElementsByTagName('script')[0];

        scriptNode.src = src;
        scriptNode.async = true;

        // Inject script
        ref.parentNode.insertBefore(scriptNode, ref);

        // if callback...
        if (callback && typeof(callback) === 'function') {
            scriptNode.onload = callback;
        }

        return scriptNode;
    }

	/**
	 * Check if exist a script in HTML DOM
	 *
	 * @method checkURI
 	 * @private
	 * @param  {String}  uri Script name/path
	 * @return {Boolean} Return true if exist a script in HTML DOM
	 */
    function checkURI(uri) {
        var scripts = window.document.getElementsByTagName('script');
        var len = scripts.length;
        var i;

        for (i = 0; i < len; i++) {
            if (scripts[i] && scripts[i].src === uri) {
                return false;
            }
            else {
            	return true;
            }
        }
    }

	/**
	 * Add external JS in HTML DOM
	 *
	 * @method externalLoadJS
 	 * @private
	 * @param  {String} uris Scripts name/path
	 */
	function externalLoadJS(uris) {
		if (uris) {
			var len = uris.length;
			var i;

			for (i = 0; i < len; i++) {
				if (checkURI(uris[i])) {
					loadJS(uris[i]);
				}
			}
		}
	}

	/**
	 * Execute external code
	 *
	 * @method render
 	 * @public
	 */
	SaikuPlaygroundRenderer.prototype.render = function() {
		try {
			var self = this;
			var codeJS = replaceCode(this._data, this._options.codeJS);
			setTimeout(function() {
				$('#' + self._options.htmlObject).unblock();
				return new Function(codeJS)();
			}, self._timer);
		}
		catch (error) {
			return error;
		}
	};

	return SaikuPlaygroundRenderer;
}());
