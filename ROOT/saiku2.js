var SaikuOlapQueryTemplate = {
  "queryModel": {
    "axes": {
      "FILTER": {
        "mdx": null,
        "filters": [],
        "sortOrder": null,
        "sortEvaluationLiteral": null,
        "hierarchizeMode": null,
        "location": "FILTER",
        "hierarchies": [],
        "nonEmpty": false
      },
      "COLUMNS": {
        "mdx": null,
        "filters": [],
        "sortOrder": null,
        "sortEvaluationLiteral": null,
        "hierarchizeMode": null,
        "location": "COLUMNS",
        "hierarchies": [],
        "nonEmpty": true
      },
      "ROWS": {
        "mdx": null,
        "filters": [],
        "sortOrder": null,
        "sortEvaluationLiteral": null,
        "hierarchizeMode": null,
        "location": "ROWS",
        "hierarchies": [],
        "nonEmpty": true
      }
    },
    "visualTotals": false,
    "visualTotalsPattern": null,
    "lowestLevelsOnly": false,
    "details": {
      "axis": "COLUMNS",
      "location": "BOTTOM",
      "measures": []
    },
    "calculatedMeasures": [],
    "calculatedMembers": []
  }, 
  "queryType": "OLAP",
  "type": "QUERYMODEL"
};

var SaikuOlapQueryHelper = function(query) {
	this.query = query;
};

SaikuOlapQueryHelper.prototype.model = function() {
	return this.query.model;
};

SaikuOlapQueryHelper.prototype.clearAxis = function(axisName) {
  this.model().queryModel.axes[axisName].hierarchies = [];
};

SaikuOlapQueryHelper.prototype.getHierarchy = function(name) {
  var _searchFunction = function(he) { 
    return (he && he.name == name); 
  };

  for (var axisName in this.model().queryModel.axes) {
      var axis = this.model().queryModel.axes[axisName];
      var hierarchy = _.find(axis.hierarchies, _searchFunction);
      if (hierarchy) {
        return hierarchy;
      }
    }
    return null;
};

SaikuOlapQueryHelper.prototype.moveHierarchy = function(fromAxis, toAxis, hierarchy, position) {
  var h = this.getHierarchy(hierarchy);
  var i = this.model().queryModel.axes[fromAxis].hierarchies.indexOf(h);
  var target = this.model().queryModel.axes[toAxis].hierarchies;
  this.model().queryModel.axes[fromAxis].hierarchies.splice(i,1);
  if (typeof position != "undefined" && position > -1 && target.length > position) {
      target.splice(position, 0, h);
      return;
  } 
  target.push(h);

};

SaikuOlapQueryHelper.prototype.removeHierarchy = function(hierarchy) {
  var h = this.getHierarchy(hierarchy);
  if (!h) {
    return null;
  }
  var axis = this.findAxisForHierarchy(hierarchy);
  if (axis) {
    var i = axis.hierarchies.indexOf(h);
      axis.hierarchies.splice(i,1);  
  }
  return h;
};

SaikuOlapQueryHelper.prototype.findAxisForHierarchy = function(hierarchy) {
  for (var axisName in this.model().queryModel.axes) {
    var axis = this.model().queryModel.axes[axisName];
    if (axis.hierarchies && axis.hierarchies.length > 0) {
      for (var i = 0, len = axis.hierarchies.length; i < len; i++) {
        if (axis.hierarchies[i].name == hierarchy) {
          return axis;
        }
      }
    }
  }
  return null;
};

SaikuOlapQueryHelper.prototype.getAxis = function(axisName) {
  if (axisName in this.model().queryModel.axes) {
    return this.model().queryModel.axes[axisName];
  }
  Saiku.log("Cannot find axis: " + axisName);
};

SaikuOlapQueryHelper.prototype.removeFilter = function(filterable, flavour) {
    if (flavour && filterable.filters.length > 1) {
      var removeIndex = -1;
      for (var i = 0, len = filterable.filters.length; i < len; i++) {
        if (filterable.filters[i].flavour == flavour) {
          removeIndex = i;
        }
      }
      if (removeIndex && removeIndex >= 0) {
        filterable.filters.splice(removeIndex, 0);
      }
    } else {
      filterable.filters = [];
    }
};

SaikuOlapQueryHelper.prototype.setDefaultFilter = function(hierarchy, level, value){
  var strip = level.replace("[", "");
  strip = strip.replace("]","");
  this.includeLevel("FILTER", hierarchy, strip);
  var h = this.getHierarchy(hierarchy).levels[strip];
  h.selection = { "type": "INCLUSION", "members": [] };
  h.selection["parameterName"] = "default_filter_"+strip;
  if(!this.model().parameters){
    this.model().parameters = {};
  }
  var k = "default_filter_"+strip;
  this.model().parameters[k] = value;
};

SaikuOlapQueryHelper.prototype.getLevelForParameter = function(parameter){
  var m;
  var axes = this.model().queryModel.axes;
  _.each(axes, function(a){
    var hier = a.hierarchies;
    _.each(hier, function(h){
      _.each(h.levels, function(l){
        if(l.selection && l.selection["parameterName"] && l.selection["parameterName"] === parameter){
          m = {hierarchy:h, level:l};
          return false;
        }
      });
    });
  });
  return m;
};

SaikuOlapQueryHelper.prototype.getSelectionsForParameter = function(parameter){
  var m;
  var axes = this.model().queryModel.axes;
  _.each(axes, function(a){
    var hier = a.hierarchies;
    _.each(hier, function(h){
      _.each(h.levels, function(l){
        if(l.selection && l.selection["parameterName"] && l.selection["parameterName"] === parameter){
          m = l.selection.members;
          return false;
        }
      });
    });
  });
  return m;
};

SaikuOlapQueryHelper.prototype.addtoSelection = function(membername, level){
  if(level.level.selection.members===undefined){
    level.selection.members = [];
  }
  var found = false;
  _.each(level.level.selection.members, function(m){
    if(m.uniqueName==level.hierarchy.name+".["+level.level.name+"].["+membername+"]"){
      found = true;
    }
  });
  if(!found) {
    level.level.selection.members.push({
      uniqueName: level.hierarchy.name + ".[" + level.level.name + "].[" + membername + "]",
      caption: membername
    })
  }
};

SaikuOlapQueryHelper.prototype.includeCmember = function(hierarchy, level){
  var mHierarchy = this.getHierarchy(hierarchy);
  if (mHierarchy) {
    mHierarchy.cmembers[level]= level;
  }
}
SaikuOlapQueryHelper.prototype.includeLevel = function(axis, hierarchy, level, position) {
    var mHierarchy = this.getHierarchy(hierarchy);
    if (mHierarchy) {
      mHierarchy.levels[level] = { name: level };
    } else {
      mHierarchy = { "name": hierarchy, "levels": {}, "cmembers": {} };
      mHierarchy.levels[level] = { name: level };
    }
    
    var existingAxis = this.findAxisForHierarchy(hierarchy);
    if (existingAxis) {
      this.moveHierarchy(existingAxis.location, axis, hierarchy, position);
    } else {
      var _axis = this.model().queryModel.axes[axis];
      if (_axis) {
        if (typeof position != "undefined" && position > -1 && _axis.hierarchies.length > position) {
          _axis.hierarchies.splice(position, 0, mHierarchy);
          return;
        } 
        _axis.hierarchies.push(mHierarchy);
      } else {
        Saiku.log("Cannot find axis: " + axis + " to include Level: " + level);
      }
    }
};

SaikuOlapQueryHelper.prototype.includeLevelCalculatedMember = function(axis, hierarchy, level, uniqueName, position) {
    var mHierarchy = this.getHierarchy(hierarchy);
    if (mHierarchy) {
      mHierarchy.cmembers[uniqueName] = uniqueName;
    } else {
      mHierarchy = { "name": hierarchy, "levels": {}, "cmembers": {} };
      mHierarchy.cmembers[uniqueName] = uniqueName;
    }
    
    var existingAxis = this.findAxisForHierarchy(hierarchy);
    if (existingAxis) {
      this.moveHierarchy(existingAxis.location, axis, hierarchy, -1);
    } else {
      var _axis = this.model().queryModel.axes[axis];
      if (_axis) {
        if (typeof position != "undefined" && position > -1 && _axis.hierarchies.length > position) {
          _axis.hierarchies.splice(position, 0, mHierarchy);
          return;
        } 
        _axis.hierarchies.push(mHierarchy);
      } else {
        Saiku.log("Cannot find axis: " + axis + " to include Level: " + level);
      }
    }
};

SaikuOlapQueryHelper.prototype.removeLevel = function(hierarchy, level) {
  hierarchy = this.getHierarchy(hierarchy);
  if (hierarchy && hierarchy.levels.hasOwnProperty(level)) {
    delete hierarchy.levels[level];
  }
};

SaikuOlapQueryHelper.prototype.removeLevelCalculatedMember = function(hierarchy, level) {
  hierarchy = this.getHierarchy(hierarchy);
  if (hierarchy && hierarchy.cmembers.hasOwnProperty(level)) {
    delete hierarchy.cmembers[level];
  }
};

SaikuOlapQueryHelper.prototype.removeAllLevelCalculatedMember = function(hierarchy) {
  hierarchy = this.getHierarchy(hierarchy);
  hierarchy.cmembers = {};

};


SaikuOlapQueryHelper.prototype.includeMeasure = function(measure) {
  var measures = this.model().queryModel.details.measures,
      len = measures.length,
      i,
      aux = false;
  if (measures && !(_.isEmpty(measures))) {
    for (i = 0; i < len; i++) {
      if (measures[i].name === measure.name) {
        aux = true;
        break;
      }
      else {
        aux = false;
      }
    }

    if (aux === false) {
      measures.push(measure);
    }
  }
  else {
    measures.push(measure);
  }
};

SaikuOlapQueryHelper.prototype.removeMeasure = function(name) {
  var measures = this.query.model.queryModel.details.measures;
  var removeMeasure = _.findWhere(measures , { name: name });
  if (removeMeasure && _.indexOf(measures, removeMeasure) > -1) {
    measures = _.without(measures, removeMeasure);
    //console.log(measures);
  }
};

SaikuOlapQueryHelper.prototype.clearMeasures = function() {
  this.model().queryModel.details.measures = [];
};

SaikuOlapQueryHelper.prototype.setMeasures = function(measures) {
  this.model().queryModel.details.measures = measures;
};

SaikuOlapQueryHelper.prototype.addCalculatedMeasure = function(measure) {
  if (measure) {
    this.removeCalculatedMeasure(measure.name);
    this.model().queryModel.calculatedMeasures.push(measure);
  }
};

SaikuOlapQueryHelper.prototype.editCalculatedMeasure = function(name, measure) {
  if (measure) {
    this.removeCalculatedMeasure(name);
    this.removeCalculatedMember(name);
    this.model().queryModel.calculatedMeasures.push(measure);
  }
};

SaikuOlapQueryHelper.prototype.removeCalculatedMeasure = function(name) {
  var measures = this.model().queryModel.calculatedMeasures;
  var removeMeasure = _.findWhere(measures , { name: name });
  if (removeMeasure && _.indexOf(measures, removeMeasure) > -1) {
    measures = _.without(measures, removeMeasure);
    this.model().queryModel.calculatedMeasures = measures;
    //console.log(measures);
  }
};

SaikuOlapQueryHelper.prototype.getCalculatedMeasures = function() {
  var ms = this.model().queryModel.calculatedMeasures;
  if (ms) {
    return ms;
  }
  return null;
};

SaikuOlapQueryHelper.prototype.addCalculatedMember = function(measure) {
  if (measure) {
    this.removeCalculatedMember(measure.name);
    this.model().queryModel.calculatedMembers.push(measure);
  }
};

SaikuOlapQueryHelper.prototype.editCalculatedMember = function(name, measure) {
  if (measure) {
    this.removeCalculatedMeasure(name);
    this.removeCalculatedMember(name);
    this.model().queryModel.calculatedMembers.push(measure);
  }
};

SaikuOlapQueryHelper.prototype.removeCalculatedMember = function(name) {
  var measures = this.model().queryModel.calculatedMembers;
  var removeMeasure = _.findWhere(measures , { name: name });
  if (removeMeasure && _.indexOf(measures, removeMeasure) > -1) {
    measures = _.without(measures, removeMeasure);
    this.model().queryModel.calculatedMembers = measures;
    //console.log(measures);
  }
};

SaikuOlapQueryHelper.prototype.getCalculatedMembers = function() {
  var ms = this.model().queryModel.calculatedMembers;
  if (ms) {
    return ms;
  }
  return null;
};

SaikuOlapQueryHelper.prototype.swapAxes = function() {
  var axes = this.model().queryModel.axes;
  var tmpAxis = axes.ROWS;
  tmpAxis.location = 'COLUMNS';
  axes.ROWS = axes.COLUMNS;
  axes.ROWS.location = 'ROWS';
  axes.COLUMNS = tmpAxis;
};

SaikuOlapQueryHelper.prototype.nonEmpty = function(nonEmpty) {
  if (nonEmpty) {
    this.model().queryModel.axes.ROWS.nonEmpty = true;
    this.model().queryModel.axes.COLUMNS.nonEmpty = true;
  } else {
    this.model().queryModel.axes.ROWS.nonEmpty = false;
    this.model().queryModel.axes.COLUMNS.nonEmpty = false;
  }
};




/*
 *   Copyright 2015 OSBI Ltd
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
 * Model and collections for date filter
 */
var DateFilterModel = Backbone.Model.extend({});

var DateFilterCollection = Backbone.Collection.extend({
	model: DateFilterModel
});/*
 *   Copyright 2015 OSBI Ltd
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
 * Model which fetches the levels
 *
 * @class Level
 */
var Level = Backbone.Model.extend({
    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     */
    initialize: function(args, options) {
        if (options && !(_.isEmpty(options))) {
            this.ui = options.ui;
            this.cube = options.cube;
            this.dimension = options.dimension;
            this.hierarchy = options.hierarchy;
        }
    },

    /**
     * Returns the relative URL where the model's resource would be located on the server
     *
     * @method url
     * @private
     * @return {String} Relative URL
     */
    url: function() {
        return Saiku.session.username + '/discover/' + this.cube + '/dimensions/' + this.dimension + '/hierarchies/' + 
            this.hierarchy + '/levels';
    }
});

/**
 * Model which fetches the members
 *
 * @class LevelMember
 */
var LevelMember = Backbone.Model.extend({
    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     */
    initialize: function(args, options) {
        if (options && !(_.isEmpty(options))) {
            this.ui = options.ui;
            this.cube = options.cube;
            this.dimension = options.dimension;
            this.hierarchy = options.hierarchy;
            this.level = options.level;
        }
    },

    /**
     * Returns the relative URL where the model's resource would be located on the server
     *
     * @method url
     * @private
     * @return {String} Relative URL
     */
    url: function() {
        return Saiku.session.username + '/discover/' + this.cube + '/dimensions/' + this.dimension + '/hierarchies/' + 
            this.hierarchy + '/levels/' + encodeURIComponent(this.level);
    }
});

/**
 * Model which fetches the child members
 *
 * @class LevelMember
 */
var LevelChildMember = Backbone.Model.extend({
    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     */
    initialize: function(args, options) {
        if (options && !(_.isEmpty(options))) {
            this.ui = options.ui;
            this.cube = options.cube;
            this.uniqueName = options.uniqueName;
            this.levelUniqueName = options.levelUniqueName;
            this.mname = options.mname;
            this.mcaption = options.mcaption;
        }
    },

    /**
     * Returns the relative URL where the model's resource would be located on the server
     *
     * @method url
     * @private
     * @return {String} Relative URL
     */
    url: function() {
        return Saiku.session.username + '/discover/' + this.cube + '/member/' + encodeURIComponent(this.uniqueName) + '/children';
    }
});/*
var SaikuRendererRegistry = {

};

SaikuRendererRegistry.prototype.register = function(key, data, options) {
    if (this.hasOwnProperty(key)) {
        return new SaikuRendererRegistry[key](data, options);
    } else {
        throw("No renderer with name '" + key + "' registered!");
    }
};
*/

var SaikuRendererOptions = {
    mode: null,
    dataMode: null,
    htmlObject: null,
    width: null,
    height: null
};

var SaikuRenderer = function(data, options) {
    this._options = _.extend(SaikuRendererOptions, options);
    this._hasProcessed = false;
    if (typeof Backbone !== "undefined") {
        _.extend(this, Backbone.Events);
    }

this.render = function(data, options) {
    var r = null;
    if (typeof Backbone !== "undefined") {
        this.trigger('render:start', this );
    }

    if (!this.hasProcessedData()) {
        this.processData(data, options);
    }
    r = this._render(data, options);
    if (typeof Backbone !== "undefined") {
        this.trigger('render:end', this );
    }
    return r;
};

this.processData = function(data, options) {
    if (typeof Backbone !== "undefined") {
        this.trigger('processData:start', this );
    }
    this._processData(data, options);
    if (typeof Backbone !== "undefined") {
        this.trigger('processData:end', this );
    }
};
this.hasProcessedData = function() {
    return this._hasProcessed;
};


this._render = function(data, options) {};
this._processData = function(data, options) {};

if (data) {
        this._data = data;
        this.processData(data, options);
        this._hasProcessed = true;
}

};
function SaikuTableRenderer(data, options) {
    this._data = data;
    this._options = _.extend({}, SaikuRendererOptions, options);
}


SaikuTableRenderer.prototype.render = function(data, options) {
        var self = this;
        if (data) {
            this._data = data;
        }
        if (options) {
            this._options = _.extend({}, SaikuRendererOptions, options);
        }

        if (typeof this._data == "undefined") {
            return;
        }

        if (this._data != null && this._data.error != null) {
            return;
        }        
        if (this._data == null || (this._data.cellset && this._data.cellset.length === 0)) {
            return;
        }
        if (this._options.htmlObject) {
//            $(this._options.htmlObject).stickyTableHeaders("destroy");

            // in case we have some left over scrollers
            if (self._options.hasOwnProperty('batch')) {
                $(self._options.htmlObject).parent().parent().unbind('scroll');
            }

            _.defer(function(that) {
                if (self._options.hasOwnProperty('batch') && !self._options.hasOwnProperty('batchSize')) {
                    self._options['batchSize'] = 1000;
                }

                var html =  self.internalRender(self._data, self._options);
                $(self._options.htmlObject).html(html);
//                $(self._options.htmlObject).stickyTableHeaders( { container: self._options.htmlObject.parent().parent(), fixedOffset: self._options.htmlObject.parent().parent().offset().top });

                _.defer(function(that) {
                    if (self._options.hasOwnProperty('batch') && self._options.hasBatchResult) {                        
                        var batchRow = 0;
                        var batchIsRunning = false;
                        var batchIntervalSize = self._options.hasOwnProperty('batchIntervalSize') ? self._options.batchIntervalSize : 20;
                        var batchIntervalTime = self._options.hasOwnProperty('batchIntervalTime') ? self._options.batchIntervalTime : 20;

                        var len = self._options.batchResult.length;
                        
                        var batchInsert = function() {
                            // maybe add check for reach table bottom - ($('.workspace_results').scrollTop() , $('.workspace_results table').height()
                            if (!batchIsRunning && len > 0 && batchRow < len) {
                                batchIsRunning = true;
                                var batchContent = "";
                                var startb = batchRow;
                                for (var i = 0;  batchRow < len && i < batchIntervalSize ; i++, batchRow++) {
                                    batchContent += self._options.batchResult[batchRow];
                                }
                                if (batchRow > startb) {
                                    $(self._options.htmlObject).append( $(batchContent));
                                }
                                batchIsRunning = false;
                            }
                            if (batchRow >= len) {
                                $(self._options.htmlObject).parent().parent().unbind('scroll');
                            }
                        };

                        var lazyBatchInsert = _.debounce(batchInsert, batchIntervalTime);
                        $(self._options.htmlObject).parent().parent().scroll(function () { 
                            lazyBatchInsert();
                        });
                    }
                });
                return html;
            });
        } else {
            var html =  this.internalRender(this._data, self._options);
            return html;
        }
        
};

SaikuTableRenderer.prototype.clear = function(data, options) {
    var self = this;
    if (this._options && this._options.htmlObject && this._options.hasOwnProperty('batch')) {
        $(self._options.htmlObject).parent().parent().unbind('scroll');
    }

};

SaikuTableRenderer.prototype.processData = function(data, options) {
    this._hasProcessed = true;
};

function genTotalDataCells(currentIndex, cellIndex, scanSums, scanIndexes, lists) {
    var contents = '';
    var lists = lists[ROWS];
    for (var i = scanSums.length - 1; i >= 0; i--) {
        if (currentIndex == scanSums[i]) {
            var currentListNode = lists[i][scanIndexes[i]];
            for (var m = 0; m < currentListNode.cells.length; m++)
                contents += '<td class="data total">' + currentListNode.cells[m][cellIndex].value + '</td>';
            scanIndexes[i]++;
            if (scanIndexes[i] < lists[i].length)
                scanSums[i] += lists[i][scanIndexes[i]].width;
        }
    }
    return contents;
}

function genTotalHeaderCells(currentIndex, bottom, scanSums, scanIndexes, lists, wrapContent) {
    var contents = '';
    for (var i = bottom; i >= 0; i--) {
        if (currentIndex == scanSums[i]) {
            var currentListNode = lists[i][scanIndexes[i]];
            var cssClass;
            if (i == 0 && bottom == 1)
                cssClass = "col";
            else if (i == bottom)
                cssClass = "col_total_corner";
            else if (i == bottom - 1 && currentListNode.captions)
                cssClass = "col_total_first";
            else cssClass = "col_null";
            
            for (var m = 0; m < currentListNode.cells.length; m++) {
                var text = '&nbsp;';
                if (bottom == lists.length - 1) {
                    if (currentListNode.captions) {
                        text = lists[i][scanIndexes[i]].captions[m];
                    }
                    if (i == 0 && scanIndexes[i] == 0) {
                        if (currentListNode.captions)
                            text += "&nbsp;";
                        else text = "";
                        text += (wrapContent ? "<span class='i18n'>Grand Total</span>" :  "Grand Total");
                    }
                }
                contents += '<th class="' + cssClass + '">'
                  + (wrapContent ? '<div>' + text + '</div>' : text ) + '</th>';
            }
            scanIndexes[i]++;
            if (scanIndexes[i] < lists[i].length)
                scanSums[i] += lists[i][scanIndexes[i]].width;
        }
    }
    return contents;
}

function totalIntersectionCells(currentIndex, bottom, scanSums, scanIndexes, lists) {
    var contents = '';
    for (var i = bottom; i >= 0; i--) {
        if (currentIndex == scanSums[i]) {
            var currentListNode = lists[i][scanIndexes[i]];
            var cssClass = "data total";
            for (var m = 0; m < currentListNode.cells.length; m++) {
                var text = '&nbsp;';
                contents += '<td class="' + cssClass + '">' + text + '</td>';
            }
            scanIndexes[i]++;
            if (scanIndexes[i] < lists[i].length)
                scanSums[i] += lists[i][scanIndexes[i]].width;
        }
    }
    return contents;
}

function genTotalHeaderRowCells(currentIndex, scanSums, scanIndexes, totalsLists, wrapContent) {
    var colLists = totalsLists[COLUMNS];
    var colScanSums = scanSums[COLUMNS];
    var colScanIndexes = scanIndexes[COLUMNS];
    var bottom = colLists.length - 2;
    var contents = '';
    for (var i = bottom; i >= 0; i--) {
        if (currentIndex == colScanSums[i]) {
            for (var m = 0; m < colLists[i][colScanIndexes[i]].cells.length; m++) {
                contents += '<tr>';
                for (var j = 0; j <= bottom; j++) {
                    var cssClass;
                    var text = '&nbsp;';
                    if (i == 0 && j == 0)
                        cssClass = 'row';
                    else if (i == j + 1) 
                        cssClass = 'row_total_corner';
                    else if (i == j && colLists[i][colScanIndexes[i]].captions) {
                        cssClass = 'row_total_first';
                    } else if (i < j + 1)
                        cssClass = 'row_total';
                    else
                        cssClass = 'row_null';
                    if (j == bottom ) {
                        if (colLists[i][colScanIndexes[i]].captions) {
                            text = colLists[i][colScanIndexes[i]].captions[m];
                        }
                        if (i == 0 && colScanIndexes[i] == 0) {
                            if (colLists[i][colScanIndexes[i]].captions)
                                text += "&nbsp;";
                            else text = "";
                            text += (wrapContent ? "<span class='i18n'>Grand Total</span>" :  "Grand Total");
                        }
                    }
                    contents += '<th class="' + cssClass + '">'
                                + (wrapContent ? '<div>' + text + '</div>' : text ) + '</th>';

                }
                
                var scanIndexes = {};
                var scanSums = {};
                for (var z = 0; z < totalsLists[ROWS].length; z++) {
                    scanIndexes[z] = 0;
                    scanSums[z] = totalsLists[ROWS][z][scanIndexes[z]].width;
                }
                for (var k = 0; k < colLists[i][colScanIndexes[i]].cells[m].length; k++) {
                    contents += '<td class="data total">' + colLists[i][colScanIndexes[i]].cells[m][k].value + '</td>';
                    contents += totalIntersectionCells(k + 1, totalsLists[ROWS].length - 1, scanSums, scanIndexes, totalsLists[ROWS]);
                }
                contents += '</tr>';
            }
            colScanIndexes[i]++;
            if (colScanIndexes[i] < colLists[i].length)
                colScanSums[i] += colLists[i][colScanIndexes[i]].width;
        }
    }
    return contents;
}

var ROWS = "ROWS";
var COLUMNS = "COLUMNS";

function nextParentsDiffer(data, row, col) {
    while (row-- > 0) {
        if (data[row][col].properties.uniquename != data[row][col + 1].properties.uniquename)
            return true;
    }
    return false;
}


function topParentsDiffer(data, row, col) {
    while (col-- > 0)
        if (data[row][col].properties.uniquename != data[row - 1][col].properties.uniquename)
            return true;
    return false;
}

SaikuTableRenderer.prototype.internalRender = function(allData, options) {
    var tableContent = "";
    var rowContent = "";
    var data = allData.cellset;

    var table = data ? data : [];
    var colSpan;
    var colValue;
    var isHeaderLowestLvl;
    var isBody = false;
    var firstColumn;
    var isLastColumn, isLastRow;
    var nextHeader;
    var processedRowHeader = false;
    var lowestRowLvl = 0;
    var rowGroups = [];
    var batchSize = null;
    var batchStarted = false;
    var isColHeader = false, isColHeaderDone = false;
    var resultRows = [];
    var wrapContent = true;
    if (options) {
        batchSize = options.hasOwnProperty('batchSize') ? options.batchSize : null;
        wrapContent = options.hasOwnProperty('wrapContent') ? options.wrapContent : true;
    }
    var totalsLists = {};
    totalsLists[COLUMNS] = allData.rowTotalsLists;
    totalsLists[ROWS] = allData.colTotalsLists;
    
    var scanSums = {};
    var scanIndexes = {};
    
    var dirs = [ROWS, COLUMNS];
    
    for (var i = 0; i < dirs.length; i++) {
        scanSums[dirs[i]] = new Array();
        scanIndexes[dirs[i]] = new Array();
    }
    if (totalsLists[COLUMNS])
        for (var i = 0; i < totalsLists[COLUMNS].length; i++) {
            scanIndexes[COLUMNS][i] = 0;
            scanSums[COLUMNS][i] = totalsLists[COLUMNS][i][scanIndexes[COLUMNS][i]].width;
        }

    for (var row = 0, rowLen = table.length; row < rowLen; row++) {
        var rowShifted = row - allData.topOffset;
        colSpan = 1;
        colValue = "";
        isHeaderLowestLvl = false;
        isLastColumn = false;
        isLastRow = false;
        isColHeader = false;
        var headerSame = false;

        if (totalsLists[ROWS])
            for (var i = 0; i < totalsLists[ROWS].length; i++) {
                scanIndexes[ROWS][i] = 0;
                scanSums[ROWS][i] = totalsLists[ROWS][i][scanIndexes[ROWS][i]].width;
            }
        rowContent = "<tr>";
        if ( row === 0) {
            rowContent = "<thead>" + rowContent;
        }
        for (var col = 0, colLen = table[row].length; col < colLen; col++) {
            var colShifted = col - allData.leftOffset;
            var header = data[row][col];
            if (header.type === "COLUMN_HEADER") {
                isColHeader = true;
            }

            // If the cell is a column header and is null (top left of table)
            if (header.type === "COLUMN_HEADER" && header.value === "null" && (firstColumn == null || col < firstColumn)) {
                rowContent += '<th class="all_null">&nbsp;</th>';
            } // If the cell is a column header and isn't null (column header of table)
            else if (header.type === "COLUMN_HEADER") {
                if (firstColumn == null) {
                    firstColumn = col;
                }
                if (table[row].length == col+1)
                    isLastColumn = true;
                else
                    nextHeader = data[row][col+1];


                if (isLastColumn) {
                    // Last column in a row...
                    if (header.value == "null") {
                        rowContent += '<th class="col_null">&nbsp;</th>';
                    } else {
                        if (totalsLists[ROWS])
                            colSpan = totalsLists[ROWS][row + 1][scanIndexes[ROWS][row + 1]].span;
                        rowContent += '<th class="col" style="text-align: center;" colspan="' + colSpan + '" title="' + header.value + '">'
                            + (wrapContent ? '<div rel="' + row + ":" + col +'">' + header.value + '</div>' : header.value)
                            + '</th>';    
                    }
                    
                } else {
                    // All the rest...
                    var groupChange = (col > 1 && row > 1 && !isHeaderLowestLvl && col > firstColumn) ?
                        data[row-1][col+1].value != data[row-1][col].value || data[row-1][col+1].properties.uniquename != data[row-1][col].properties.uniquename
                        : false;

                    var maxColspan = colSpan > 999 ? true : false;
                    if (header.value != nextHeader.value || nextParentsDiffer(data, row, col) || isHeaderLowestLvl || groupChange || maxColspan) {
                        if (header.value == "null") {
                            rowContent += '<th class="col_null" colspan="' + colSpan + '">&nbsp;</th>';
                        } else {
                            if (totalsLists[ROWS])
                                colSpan = totalsLists[ROWS][row + 1][scanIndexes[ROWS][row + 1]].span;
                            rowContent += '<th class="col" style="text-align: center;" colspan="' + (colSpan == 0 ? 1 : colSpan) + '" title="' + header.value + '">'
                            + (wrapContent ? '<div rel="' + row + ":" + col +'">' + header.value + '</div>' : header.value)
                            + '</th>';    
                        }
                        colSpan = 1;
                    } else {
                        colSpan++;
                    }
                }
                if (totalsLists[ROWS])
                    rowContent += genTotalHeaderCells(col - allData.leftOffset + 1, row + 1, scanSums[ROWS], scanIndexes[ROWS], totalsLists[ROWS], wrapContent);
            } // If the cell is a row header and is null (grouped row header)
            else if (header.type === "ROW_HEADER" && header.value === "null") {
                rowContent += '<th class="row_null">&nbsp;</th>';
            } // If the cell is a row header and isn't null (last row header)
            else if (header.type === "ROW_HEADER") {
                if (lowestRowLvl == col)
                    isHeaderLowestLvl = true;
                else
                    nextHeader = data[row][col+1];

                var previousRow = data[row - 1];

                var same = !headerSame && !isHeaderLowestLvl && (col == 0 || !topParentsDiffer(data, row, col)) && header.value === previousRow[col].value;
                headerSame = !same;
                var value = (same ? "<div>&nbsp;</div>" : '<div rel="' + row + ":" + col +'">' + header.value + '</div>');
                if (!wrapContent) {
                    value = (same ? "&nbsp;" : header.value );
                }
                var tipsy = "";
                /* var tipsy = ' original-title="';
                if (!same && header.metaproperties) {
                    for (key in header.metaproperties) {
                        if (key.substring(0,1) != "$" && key.substring(1,2).toUpperCase() != key.substring(1,2)) {
                            tipsy += "<b>" + safe_tags_replace(key) + "</b> : " + safe_tags_replace(header.metaproperties[key]) + "<br>";
                        }
                    }
                }
                tipsy += '"';
                */
                var cssclass = (same ? "row_null" : "row");
                var colspan = 0;

                if (!isHeaderLowestLvl && (typeof nextHeader == "undefined" || nextHeader.value === "null")) {
                    colspan = 1;
                    var group = header.properties.dimension;
                    var level = header.properties.level;
                    var groupWidth = (group in rowGroups ? rowGroups[group].length - rowGroups[group].indexOf(level) : 1);
                    for (var k = col + 1; colspan < groupWidth && k <= (lowestRowLvl+1) && data[row][k] !== "null"; k++) {
                        colspan = k - col;
                    }
                    col = col + colspan -1;
                }
                rowContent += '<th class="' + cssclass + '" ' + (colspan > 0 ? ' colspan="' + colspan + '"' : "") + tipsy + '>' + value + '</th>';
            }
            else if (header.type === "ROW_HEADER_HEADER") {
                rowContent += '<th class="row_header">' + (wrapContent ? '<div>' + header.value + '</div>' : header.value) + '</th>';
                isHeaderLowestLvl = true;
                processedRowHeader = true;
                lowestRowLvl = col;
                if (header.properties.hasOwnProperty("dimension")) {
                    var group = header.properties.dimension;
                    if (!(group in rowGroups)) {
                        rowGroups[group] = [];
                    }
                    rowGroups[group].push(header.properties.level);
                }
            } // If the cell is a normal data cell
            else if (header.type === "DATA_CELL") {
                batchStarted = true;
                var color = "";
                var val = header.value;
                var arrow = "";
                if (header.properties.hasOwnProperty('image')) {
                    var img_height = header.properties.hasOwnProperty('image_height') ? " height='" + header.properties.image_height + "'" : "";
                    var img_width = header.properties.hasOwnProperty('image_width') ? " width='" + header.properties.image_width + "'" : "";
                    val = "<img " + img_height + " " + img_width + " style='padding-left: 5px' src='" + header.properties.image + "' border='0'>";
                }

                if (header.properties.hasOwnProperty('style')) {
                    color = " style='background-color: " + header.properties.style + "' ";
                }
                if (header.properties.hasOwnProperty('link')) {
                    val = "<a target='__blank' href='" + header.properties.link + "'>" + val + "</a>";
                }
                if (header.properties.hasOwnProperty('arrow')) {
                    arrow = "<img height='10' width='10' style='padding-left: 5px' src='./images/arrow-" + header.properties.arrow + ".gif' border='0'>";
                }

                rowContent += '<td class="data" ' + color + '>'
                        + (wrapContent ? '<div class="datadiv" alt="' + header.properties.raw + '" rel="' + header.properties.position + '">' : "")
                        + val + arrow 
                        + (wrapContent ? '</div>' : '') + '</td>';
                if (totalsLists[ROWS])
                    rowContent += genTotalDataCells(colShifted + 1, rowShifted, scanSums[ROWS], scanIndexes[ROWS], totalsLists, wrapContent);
            }
        }
        rowContent += "</tr>";
        var totals = "";
        if (totalsLists[COLUMNS] && rowShifted >= 0) {
            totals += genTotalHeaderRowCells(rowShifted + 1, scanSums, scanIndexes, totalsLists, wrapContent);
        }
        if (batchStarted && batchSize) {
                if (row <= batchSize) {
                    if (!isColHeader && !isColHeaderDone) {
                        tableContent += "</thead><tbody>";
                        isColHeaderDone = true;
                    }
                    tableContent += rowContent;
                    if (totals.length > 0) {
                        tableContent += totals;
                    }
                    
                } else {
                    resultRows.push(rowContent);
                    if (totals.length > 0) {
                        resultRows.push(totals);
                    }
                        
                }
        } else {
            if (!isColHeader && !isColHeaderDone) {
                tableContent += "</thead><tbody>";
                isColHeaderDone = true;
            }
            tableContent += rowContent;
            if (totals.length > 0) { 
                tableContent += totals;
            }
        }
    }
    if (options) {
        options['batchResult'] = resultRows;
        options['hasBatchResult'] = resultRows.length > 0;
    }
    return "<table>" + tableContent + "</tbody></table>";
};/*  
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
 * Model which fetches the dimensions and measures of a cube
 */
var Cube = Backbone.Model.extend({
    initialize: function(args) {
        this.url = Saiku.session.username + "/discover/" +
            args.key + "/metadata";
    },
    
    parse: function(response) {
        var template_dimensions = _.template($("#template-dimensions").html(), { dimensions: response.dimensions });
        var template_measures = _.template($("#template-measures").html(), { measures: response.measures });
        var template_attributes = _.template($("#template-attributes").html(), { cube: response });

        this.set({ 
            template_measures: template_measures,
            template_dimensions: template_dimensions,
            template_attributes: $(template_attributes).html(),
            data: response
        });


        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.setItem("cube." + this.get('key'), JSON.stringify(this));
        }
        
        return response;
    }
});
/*
 *   Copyright 2015 OSBI Ltd
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
 * Model which fetches the information of Data Sources
 *
 * @class DateSources
 */
var DataSources = Backbone.Model.extend({
    /**
     * Returns the relative URL where the model's resource would be located on the server
     *
     * @property url
     * @type {String}
     * @private
     */
	url: 'admin/attacheddatasources',

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     */
	initialize: function(args, options) {
        if (options && options.dialog) {
        	this.dialog = options.dialog;
        }
	},

	/**
	 * Parse is called whenever a model's data is returned by the server, in fetch, and save
	 *
	 * @method parse
	 * @private
	 * @param  {Object} response Returned data from the server
	 */
	parse: function(response) {
        if (this.dialog) {
            this.dialog.callback(response);
        }
	}
});

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
 * Controls the appearance and behavior of the dimension list
 * 
 * This is where drag and drop lives
 */
var DimensionList = Backbone.View.extend({
    events: {
        'click span': 'select',
        'click a': 'select',
        'click .parent_dimension ul li a.level' : 'select_dimension',
        'click .measure' : 'select_measure',
        'click .addMeasure' : 'measure_dialog'
    },
    
    initialize: function(args) {
        // Don't lose this
        _.bindAll(this, "render", "load_dimension","select_dimension");
        
        // Bind parent element
        this.workspace = args.workspace;
        this.cube = args.cube;
    },
    
    load_dimension: function() {
        this.template = this.cube.get('template_attributes');
        this.render_attributes();
        this.workspace.sync_query();

    },
    
    render: function() {
         // Fetch from the server if we haven't already
        if (this.cube && this.cube.has('template_attributes')) {
            this.load_dimension();
        } else if (! this.cube){
            $(this.el).html('Could not load attributes. Please log out and log in again.');
        } else {
            var template = _.template($("#template-attributes").html());
            $(this.el).html(template);
            $(this.el).find(".loading").removeClass("hide");
            this.workspace.bind('cube:loaded',  this.load_dimension);

        }

        return this;
    },

    render_attributes: function() {
        // Pull the HTML from cache and hide all dimensions
        var self = this;
        $(this.el).html(this.template);
        if (isIE && isIE <= 8) {
            $(this.el).show();
        } else {
            $(this.el).fadeTo(500,1);
        }
        
        // Add draggable behavior
        $(this.el).find('.addMeasure, .calculated_measures').show();
        $(this.el).find('.measure').parent('li').draggable({
            cancel: '.not-draggable',
            connectToSortable: $(this.workspace.el).find('.fields_list_body.details ul.connectable'),
            helper: 'clone',
            placeholder: 'placeholder',
            opacity: 0.60,
            tolerance: 'touch',
            containment:    $(self.workspace.el),
            cursorAt: { top: 10, left: 35 }
        });        

        $(this.el).find('.level').parent('li').draggable({
            cancel: '.not-draggable, .hierarchy',
            connectToSortable: $(this.workspace.el).find('.fields_list_body.columns > ul.connectable, .fields_list_body.rows > ul.connectable, .fields_list_body.filter > ul.connectable'),
            containment:    $(self.workspace.el),
            //helper: "clone",
            helper: function(event, ui){
                var target = $(event.target).hasClass('d_level') ? $(event.target) : $(event.target).parent();
                var hierarchy = target.find('a').attr('hierarchy');
                var level = target.find('a').attr('level');
                var h = target.parent().clone().removeClass('d_hierarchy').addClass('hierarchy');
                h.find('li a[hierarchy="' + hierarchy + '"]').parent().hide();
                h.find('li a[level="' + level + '"]').parent().show();
                var selection = $('<li class="selection"></li>');
                selection.append(h);
                return selection;

            },

            placeholder: 'placeholder',
            opacity: 0.60,
            tolerance: 'touch',
            cursorAt: {
                top: 10,
                left: 85
            }
        });
    },
    
    select: function(event) {
        var $target = $(event.target).hasClass('root') ? $(event.target) : $(event.target).parent().find('span');
        if ($target.hasClass('root')) {
            $target.find('a').toggleClass('folder_collapsed').toggleClass('folder_expand');
            $target.toggleClass('collapsed').toggleClass('expand');
            $target.parents('li').find('ul').children('li').toggle();

            if($target.hasClass('expand')){
                Saiku.events.trigger("workspace:expandDimension", this, null);

            }
        }
        
        return false;
    },

     select_dimension: function(event, ui) {
        if (this.workspace.query.model.type != "QUERYMODEL") {
            return;
        }
        if ($(event.target).parent().hasClass('ui-state-disabled')) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        var hierarchy = $(event.target).attr('hierarchy');
        var hierarchyCaption = $(event.target).parent().parent().attr('hierarchycaption');
        var level = $(event.target).attr('level');
        var axisName = "ROWS";
        var isCalcMember = $(event.target).parent().hasClass('dimension-level-calcmember');

        if ($(this.workspace.el).find(".workspace_fields ul.hierarchy[hierarchy='" + hierarchy + "']").length > 0) {
             var $level = $(this.workspace.el).find(".workspace_fields ul[hierarchy='" + hierarchy + "'] a[level='" + level + "']").parent().show();
            axisName = $level.parents('.fields_list_body').hasClass('rows') ? "ROWS" : "COLUMNS";
        } else {
            var $axis = $(this.workspace.el).find(".workspace_fields .fields_list[title='ROWS'] ul.hierarchy").length > 0 ?
                $(this.workspace.el).find(".workspace_fields .fields_list[title='COLUMNS'] ul.connectable") :
                $(this.workspace.el).find(".workspace_fields .fields_list[title='ROWS'] ul.connectable") ;

            axisName = $axis.parents('.fields_list').attr('title');
        }

        if (isCalcMember) {
            var uniqueName = $(event.target).attr('uniquename');
            this.workspace.toolbar.$el.find('.group_parents').removeClass('on');
            this.workspace.toolbar.group_parents();
            this.workspace.query.helper.includeLevelCalculatedMember(axisName, hierarchy, level, uniqueName);
        }
        else {
            this.workspace.query.helper.includeLevel(axisName, hierarchy, level);
        }

        // Trigger event when select dimension
        Saiku.session.trigger('dimensionList:select_dimension', { workspace: this.workspace });

        this.workspace.sync_query();
        this.workspace.query.run();
        event.preventDefault();
        return false;
    },

    select_measure: function(event, ui) {
        if ($(event.target).parent().hasClass('ui-state-disabled')) {
            return;
        }
        var $target = $(event.target).parent().clone();
        var measure = {
            "name": $target.find('a').attr('measure'),
            "type": $target.find('a').attr('type')
        };
        this.workspace.query.helper.includeMeasure(measure);
        this.workspace.sync_query();
        this.workspace.query.run();
        event.preventDefault();
        return false;
    },

    measure_dialog: function(event, ui) {
        (new CalculatedMemberModal({ 
            workspace: this.workspace,
            measure: null
        })).render().open();
    }
});
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
 * The global toolbar
 */
var Toolbar = Backbone.View.extend({
    tagName: "div",

    events: {
        'click a' : 'call',
        'click #logo': 'site'
    },

    template: function() {
        return _.template( $("#template-toolbar").html() )({data: this});
    },

    initialize: function() {
        _.extend(this, Backbone.Events);
        _.bindAll(this, "call");
        var self = this;
        if(Settings.LOGO){
            self.logo = "<h1 id='logo_override'>"+
                "<img src='"+Settings.LOGO+"'/>"+
                "</h1>";
            self.render();
        }
        else{
            self.logo = "<h1 id='logo'>"+
                "<a href='http://www.meteorite.bi/' title='Saiku - Next Generation Open Source Analytics' target='_blank' class='sprite'>Saiku</a>"+
                "</h1>";
            self.render();
        }
    },

    render: function() {
        $(this.el).attr('id', 'toolbar')
            .html(this.template());

        // Trigger render event on toolbar so plugins can register buttons
        Saiku.events.trigger('toolbar:render', { toolbar: this });

        return this;
    },

    call: function(e) {
        var target = $(e.target);
        var callback = target.attr('href').replace('#', '');
        if(this[callback]) {
            this[callback](e);
        }
        e.preventDefault();
    },
    /**
     * Add a new tab to the interface
     */
    new_query: function() {
        if(typeof ga!= 'undefined'){
		ga('send', 'event', 'MainToolbar', 'New Query');
        }
        var wspace = new Workspace();
        Saiku.tabs.add(wspace);
        Saiku.events.trigger('toolbar:new_query', this, wspace);
        return false;
    },

    /**
     * Open a query from the repository into a new tab
     */
    open_query: function() {
        var tab = _.find(Saiku.tabs._tabs, function(tab) {
            return tab.content instanceof OpenQuery;
        });

        if (tab) {
            tab.select();
        } else {
            Saiku.tabs.add(new OpenQuery());
        }

        return false;
    },

    /**
     * Clear the current session and show the login window
     */
    logout: function() {
        Saiku.session.logout();
    },

    /**
     * Show the credits dialog
     */
    about: function() {
        (new AboutModal()).render().open();
        return false;
    },

    /**
     * Go to the issue tracker
     */
    issue_tracker: function() {
        window.open('http://jira.meteorite.bi/');
        return false;
    },

	/**
	 * Go to the help
	 */
	help: function() {
		window.open('http://wiki.meteorite.bi/display/SAIK/Saiku+Documentation');
		return false;
	},

    /**
     * Force go to the Meteorite BI site
     */
    site: function() {
        window.open('http://www.meteorite.bi/');
        return false;
    }
});
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
 * The global toolbar
 */
var Upgrade = Backbone.View.extend({

	events: {
	},


	initialize: function(a, b) {

		this.workspace = a.workspace;

		// Fire off workspace event
		this.workspace.trigger('workspace:toolbar:render', {
			workspace: this.workspace
		});

	},

	daydiff: function(first, second) {
		return Math.round((second-first)/(1000*60*60*24));
	},

	render: function() {

		var self = this;
		var license = new License();

		if(Settings.BIPLUGIN5){
				if(Saiku.session.get("notice") != undefined && Saiku.session.get("notice")!=null && Saiku.session.get("notice")!=""){
					$(this.el).append("<div><div id='uphead' class='upgradeheader'>Notice:"+Saiku.session.get("notice")+"</div>");

				}
				if (Settings.LICENSE.licenseType != undefined && (Settings.LICENSE.licenseType != "trial" && Settings.LICENSE.licenseType != "Open Source License")) {
					return this;
				}
				if (Settings.LICENSE != undefined && Settings.LICENSE.licenseType === "trial") {
					var yourEpoch = parseFloat(Settings.LICENSE.expiration);
					var yourDate = new Date(yourEpoch);
					self.remainingdays = self.daydiff(new Date(), yourDate);


					$(this.el).append("<div><div id='uphead' class='upgradeheader'>You are using a Saiku Enterprise" +
						" Trial license, you have "+ self.remainingdays+" days remaining. <a href='http://www.meteorite.bi/saiku-pricing'>Buy licenses online.</a></div>");
					return self;
				}
				else {
					$(this.el).append("<div><div id='uphead' class='upgradeheader'>You are using Saiku Community" +
						" Edition, please consider upgrading to <a target='_blank' href='http://meteorite.bi'>Saiku Enterprise</a>, or entering a <a href='http://meteorite.bi/products/saiku/sponsorship'>sponsorship agreement with us</a> to support development. " +
						"<a href='http://meteorite.bi/products/saiku/community'>Or contribute by joining our community and helping other users!</a></div></div>");

					return self;
				}
		}
		else {
				if(Saiku.session.get("notice") != undefined && Saiku.session.get("notice")!=null && Saiku.session.get("notice")!=""){
					$(this.el).append("<div><div id='uphead' class='upgradeheader'>Notice:"+Saiku.session.get("notice")+"</div>");

				}
				if (Settings.LICENSE.licenseType != undefined && (Settings.LICENSE.licenseType != "trial" &&
					Settings.LICENSE.licenseType != "Open Source License")) {
					return this;
				}
				if (Settings.LICENSE.licenseType === "trial") {
					var yourEpoch = parseFloat(Settings.LICENSE.expiration);
					var yourDate = new Date(yourEpoch);

					self.remainingdays = self.daydiff(new Date(), yourDate);

					$(this.el).append("<div><div id='uphead' class='upgradeheader'>You are using a Saiku Enterprise" +
						" Trial license, you have "+ self.remainingdays+" days remaining. <a href='http://www.meteorite.bi/saiku-pricing'>Buy licenses online.</a></div>");
					return self;
				}
				else {
					$(this.el).append("<div><div id='uphead' class='upgradeheader'>You are using Saiku Community" +
						" Edition, please consider upgrading to <a target='_blank' href='http://meteorite.bi'>Saiku Enterprise</a>, or entering a <a href='http://meteorite.bi/products/saiku/sponsorship'>sponsorship agreement with us</a> to support development. " +
						"<a href='http://meteorite.bi/products/saiku/community'>Or contribute by joining our community and helping other users!</a></div></div>");
					return self;
				}
		}








	},

	call: function(e) {
	}

});
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
 * The base class for all modal dialogs
 */
var Modal = Backbone.View.extend({
    tagName: "div",
    className: "dialog",
    type: "modal",
    message: "Put content here",

    options: {
        autoOpen: false,
        modal: true,
        title: "Modal dialog",
        resizable: false,
        draggable: true
    },

    events: {
        'click a': 'call'
    },

    buttons: [
        { text: "OK", method: "close" }
    ],

    template: function() {
        return _.template("<div class='dialog_icon'></div>" +
                "<div class='dialog_body'><%= message %></div>" +
        		"<div class='dialog_footer'>" +
            "<% _.each(buttons, function(button) { %>" +
                "<a class='form_button btn btn-default i18n' href='#<%= button.method %>'>&nbsp;<%= button.text %>&nbsp;</a>" +
            "<% }); %>" +
            "<div class='dialog_response'></div>"+
            "</div>")(this);
    },

    initialize: function(args) {
        _.extend(this, args);
        _.bindAll(this, "call");
        _.extend(this, Backbone.Events);
    },

    render: function() {
        $(this.el).html(this.template())
            .addClass("dialog_" + this.type)
            .dialog(this.options);

        var uiDialogTitle = $('.ui-dialog-title');
        uiDialogTitle.html(this.options.title);
        uiDialogTitle.addClass('i18n');
        Saiku.i18n.translate();
        return this;
    },

    call: function(event) {
        // Determine callback
        var callback = event.target.hash.replace('#', '');

        // Attempt to call callback
        if (! $(event.target).hasClass('disabled_toolbar') && this[callback]) {
            this[callback](event);
        }

        return false;
    },

    open: function() {
        $(this.el).dialog('open');
        this.trigger('open', { modal: this });
        return this;
    },

    close: function() {
        $(this.el).dialog('destroy').remove();
        $(this.el).remove();
        return false;
    }
});

/* jQuery UI - v1.10.2 - 2013-12-12  (and later)
 * http://bugs.jqueryui.com/ticket/9087#comment:30
 * http://bugs.jqueryui.com/ticket/9087#comment:27 - bugfix
 * http://bugs.jqueryui.com/ticket/4727#comment:23 - bugfix
 * allowInteraction fix
 */
$.ui.dialog.prototype._allowInteraction = function(event) {
    return !!$(event.target).closest('.ui-dialog, .ui-datepicker, .sp-input').length;
};
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
 * The view MDX dialog
 */
var MDXModal = Modal.extend({
    type: "mdx",
    
    initialize: function(args) {
        this.options.title = "MDX";
        this.message = _.template("<textarea><%= mdx %></textarea>")(args);
        this.bind( 'open', function( ) {
       	var self = this;
        	$(self.el).parents('.ui-dialog').css({ width: "550px" });
        });
    }
});
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
 * Dialog for member selections
 */
var SelectionsModal = Modal.extend({
    type: "selections",

    paramvalue: null,

    buttons: [
        { text: "OK", method: "save" },
        { text: "Open Date Filter", method: "open_date_filter" },
        { text: "Cancel", method: "close" }
    ],

    events: {
        'click a': 'call',
        'click .search_term' : 'search_members',
        'click .clear_search' : 'clear_search',
        'change #show_unique': 'show_unique_action',
        'change #use_result': 'use_result_action',
        'dblclick .selection_options li.option_value label' : 'click_move_selection',
        'click li.all_options' : 'click_all_member_selection',
        'change #show_totals': 'show_totals_action'
        //,'click div.updown_buttons a.form_button': 'updown_selection'
    },

    show_unique_option: false,

    use_result_option: Settings.MEMBERS_FROM_RESULT,
    show_totals_option: '',
    members_limit: Settings.MEMBERS_LIMIT,
    members_search_limit: Settings.MEMBERS_SEARCH_LIMIT,
    members_search_server: false,
    selection_type: "INCLUSION",

    initialize: function(args) {
        // Initialize properties
        var self = this;
        _.extend(this, args);
        this.options.title = "<span class='i18n'>Selections for</span> " + this.name;
        this.message = "Fetching members...";
        this.query = args.workspace.query;
        this.selected_members = [];
        this.available_members = [];
        this.topLevel;

        _.bindAll(this, "fetch_members", "populate", "finished", "get_members", "use_result_action", "show_totals_action");

        // Determine axis
        this.axis = "undefined";
        if (args.axis) {
            this.axis = args.axis;
            if (args.axis == "FILTER") {
                this.use_result_option = false;
            }
        } else {
            if (args.target.parents('.fields_list_body').hasClass('rows')) {
                this.axis = "ROWS";
            }
            if (args.target.parents('.fields_list_body').hasClass('columns')) {
                this.axis = "COLUMNS";
            }
            if (args.target.parents('.fields_list_body').hasClass('filter')) {
                this.axis = "FILTER";
                this.use_result_option = false;
            }
        }
        // Resize when rendered
        this.bind('open', this.post_render);
        this.render();

        $(this.el).parent().find('.ui-dialog-titlebar-close').bind('click',this.finished);

        // Fetch available members
        this.member = new Member({}, {
            cube: args.workspace.selected_cube,
            dimension: args.key
        });

        // Load template
        $(this.el).find('.dialog_body')
            .html(_.template($("#template-selections").html())(this));


        var hName = this.member.hierarchy;
        var lName = this.member.level;
        var hierarchy = this.workspace.query.helper.getHierarchy(hName);
        var level = null;
        if (hierarchy && hierarchy.levels.hasOwnProperty(lName)) {
            level = hierarchy.levels[lName];
        }

        if ((this.source === 'DateFilterModal' && (_.has(level, 'selection') && level.selection.members.length === 0)) ||
            (this.source === 'DateFilterModal' && (_.size(level) === 1 && _.has(level, 'name')))) {
            this.$el.find('.dialog_footer a:nth-child(2)').show();
        }
        else {
            this.$el.find('.dialog_footer a:nth-child(2)').hide();
        }

        if (Settings.ALLOW_PARAMETERS) {
            if (level) {
                var pName = level.selection ? level.selection.parameterName : null;
                if (pName) {
                    $(this.el).find('#parameter').val(pName);

                    if(this.query.helper.model().parameters[pName]!=undefined) {
                        this.paramvalue = this.query.helper.model().parameters[pName].split(",");
                    }

                }
            }
            $(this.el).find('.parameter').removeClass('hide');
        }


        var showTotalsEl = $(this.el).find('#show_totals');
        showTotalsEl.val('');

        // fixme: we should check for deepest level here
        if (_.size(hierarchy.levels) > 1 && level && level.hasOwnProperty('aggregators') && level.aggregators) {
            if (level.aggregators.length > 0) {
                this.show_totals_option = level.aggregators[0];
            }
            showTotalsEl.removeAttr("disabled");
        } else {
            showTotalsEl.attr("disabled", true);
            this.show_totals_option = '';
        }
        showTotalsEl.val(this.show_totals_option);
        showTotalsEl.removeAttr("disabled");

        $(this.el).find('#use_result').attr('checked', this.use_result_option);
        $(this.el).find('.search_limit').text(this.members_search_limit);
        $(this.el).find('.members_limit').text(this.members_limit);

        var calcMembers = this.workspace.query.helper.getCalculatedMembers();

        if (calcMembers.length > 0) {
            this.fetch_calcmembers_levels();
        }
        else {
            this.get_members();
        }
    },

    open_date_filter: function(event) {
        event.preventDefault();

        // Launch date filter dialog
        (new DateFilterModal({
            dimension: this.objDateFilter.dimension,
            hierarchy: this.objDateFilter.hierarchy,
            target: this.target,
            name: this.name,
            data: this.objDateFilter.data,
            analyzerDateFormat: this.objDateFilter.analyzerDateFormat,
            dimHier: this.objDateFilter.dimHier,
            key: this.key,
            workspace: this.workspace
        })).open();

        this.$el.dialog('destroy').remove();
    },

    show_totals_action: function(event) {
        this.show_totals_option = $(event.target).val();
    },

    get_members: function() {
            var self = this;
            var path = "/result/metadata/hierarchies/" + encodeURIComponent(this.member.hierarchy) + "/levels/" + encodeURIComponent(this.member.level);
            this.search_path = path;

            var message = '<span class="processing_image">&nbsp;&nbsp;</span> <span class="i18n">' + self.message + '</span> ';
            self.workspace.block(message);

        /**
         * gett isn't a typo, although someone should probably rename that method to avoid confusion.
         */
            this.workspace.query.action.gett(path, {
                success: this.fetch_members,
                error: function() {
                    self.workspace.unblock();
                },
                data: {result: this.use_result_option, searchlimit: this.members_limit }});
    },

    clear_search: function() {
        $(this.el).find('.filterbox').val('');
        this.get_members();
    },

    search_members: function() {
        var self = this;
        var search_term = $(this.el).find('.filterbox').val();
        if (!search_term)
            return false;

        var message = '<span class="processing_image">&nbsp;&nbsp;</span> <span class="i18n">Searching for members matching:</span> ' + search_term;
        self.workspace.block(message);
        self.workspace.query.action.gett(self.search_path, {
                async: false,

                success: function(response, model) {
                                if (model && model.length > 0) {
                                    self.available_members = model;
                                }
                                self.populate();
                            },
                error: function () {
                    self.workspace.unblock();
                },
                data: { search: search_term, searchlimit: self.members_search_limit }
        });
    },

    fetch_calcmembers_levels: function() {
        var dimHier = this.member.hierarchy.split('].[');
        var m4=true;
        if(dimHier.length===1){
            m4=false;
            dimHier = this.member.hierarchy.split('.');

        }
        if(dimHier.length>1){
            var hName = dimHier[1].replace(/[\[\]]/gi, '');
        }
        var dName = dimHier[0].replace(/[\[\]]/gi, '');


        var message = '<span class="processing_image">&nbsp;&nbsp;</span> <span class="i18n">' + this.message + '</span> ';
        this.workspace.block(message);

        if(!m4){
            if(hName!=undefined) {
                hName = dName + "." + hName;
            }
            else{
                hName = dName;
            }
        }
        var level = new Level({}, { 
            ui: this, 
            cube: this.workspace.selected_cube, 
            dimension: dName, 
            hierarchy: hName
        });

        level.fetch({
            success: this.get_levels
        });
    },

    get_levels: function(model, response) {
        if (response && response.length > 0) {
            model.ui.topLevel = response[0];
            model.ui.get_members();
        }
    },

    get_calcmembers: function() {
        var self = this;
        var hName = this.member.hierarchy;
        var calcMembers = this.workspace.query.helper.getCalculatedMembers();
        var arrCalcMembers = [];

        if (this.topLevel.name === this.member.level) {
            _.filter(calcMembers, function(value) {
                if (value.hierarchyName === hName && _.isEmpty(value.parentMember)) {
                    value.uniqueName = value.hierarchyName + '.[' + value.name + ']';
                    arrCalcMembers.push(value);
                }
            });
        }
        else {
            _.filter(calcMembers, function(value) {
                if (value.hierarchyName === hName && value.parentMemberLevel === self.member.level) {
                    value.uniqueName = value.parentMember + '.[' + value.name + ']';
                    arrCalcMembers.push(value);
                }
            });
        }

        return arrCalcMembers;
    },

    fetch_members: function(model, response) {
        var self = this;
        if (response && response.length > 0) {
            _.each(response, function(f){
                var cmem = self.workspace.query.helper.getCalculatedMembers();
                var calc = false;
                if(cmem && cmem.length>0){
                    _.each(cmem, function(c){
                        if(c.uniqueName === f.uniqueName){
                            calc = true;
                        }
                    })
                }
                self.available_members.push({obj:f, calc:calc});

            });
        }
        this.populate();
    },

    populate: function(model, response) {
            var self = this;
            self.workspace.unblock();
            this.members_search_server = (this.available_members.length >= this.members_limit || this.available_members.length == 0);

            self.show_unique_option = false;
            $(this.el).find('.options #show_unique').attr('checked',false);

            var calcMembers = this.workspace.query.helper.getCalculatedMembers();

            if (calcMembers.length > 0) {
                var newCalcMembers = this.get_calcmembers();
                var len = newCalcMembers.length;

                for (var i = 0; i < len; i++) {
                    var cmem = self.workspace.query.helper.getCalculatedMembers();
                    var calc = false;
                    if(cmem && cmem.length>0){
                        _.each(cmem, function(c){
                            if(c.uniqueName === newCalcMembers[i].uniqueName){
                                calc = true;
                            }
                        })
                    }
                    this.available_members.push({obj:newCalcMembers[i], calc:calc});
                }
            }

            $(this.el).find('.items_size').text(this.available_members.length);
            if (this.members_search_server) {
                $(this.el).find('.warning').text("More items available than listed. Pre-Filter on server.");
            } else {
                $(this.el).find('.warning').text("");
            }

            var hName = self.member.hierarchy;
            var lName = self.member.level;
            var hierarchy = self.workspace.query.helper.getHierarchy(hName);
            if (hierarchy && hierarchy.levels.hasOwnProperty(lName)) {
                this.selected_members=[];
                if(hierarchy.levels[lName].selection){
                    _.each(hierarchy.levels[lName].selection.members, function(f){
                        var cmem = self.workspace.query.helper.getCalculatedMembers();
                        var calc = false;
                        if(cmem && cmem.length>0){
                            _.each(cmem, function(c){
                                if(c.uniqueName === f.uniqueName){
                                    calc = true;
                                }
                            })
                        }
                        self.selected_members.push({obj: f, calc:calc});
                    });
                }
                this.selection_type = hierarchy.levels[lName].selection ? hierarchy.levels[lName].selection.type : "INCLUSION";
            }
            var used_members = [];

            // Populate both boxes

            /*var arr = this.paramvalue;
            _.each(this.paramvalue, function(param){
                _.each(self.selected_members, function(m){
                    if(m.name == param){
                        var idx = self.paramvalue.indexOf(param);
                        arr.splice(idx, 1);
                    }
                });
            });
*/

            for (var j = 0, len = this.selected_members.length; j < len; j++) {
                    var member = this.selected_members[j];
                    used_members.push(member.obj.caption);
            }
            if ($(this.el).find('.used_selections .selection_options li.option_value' ).length == 0) {
                var selectedMembers = $(this.el).find('.used_selections .selection_options');
                selectedMembers.empty();
                var selectedHtml = _.template($("#template-selections-options").html())({ options: this.selected_members });
                $(selectedMembers).html(selectedHtml);
            }

            // Filter out used members
            this.available_members = _.select(this.available_members, function(o) {
                return used_members.indexOf(o.obj.caption) === -1;
            });

            if (this.available_members.length > 0) {
                var availableMembersSelect = $(this.el).find('.available_selections .selection_options');
                availableMembersSelect.empty();
                var selectedHtml = _.template($("#template-selections-options").html())({ options: this.available_members });
                $(availableMembersSelect).html(selectedHtml);
            }
            if ($(self.el).find( ".selection_options.ui-selectable" ).length > 0) {
                $(self.el).find( ".selection_options" ).selectable( "destroy" );
            }

            $(self.el).find( ".selection_options" ).selectable({ distance: 20, filter: "li", stop: function( event, ui ) {

                $(self.el).find( ".selection_options li.ui-selected input").each(function(index, element) {
                    if (element && element.hasAttribute('checked')) {
                        element.checked = true;
                    } else {
                        $(element).attr('checked', true);
                    }
                    $(element).parents('.selection_options').find('li.all_options input').prop('checked', true);
                });
                $(self.el).find( ".selection_options li.ui-selected").removeClass('ui-selected');

            } });

            $(this.el).find('.filterbox').autocomplete({
                    minLength: 1, //(self.members_search_server ? 2 : 1),
                    delay: 200, //(self.members_search_server ? 400 : 300),
                    appendTo: ".autocomplete",
                    source: function(request, response ) {
                        var searchlist = self.available_members;
                        /*
                            if (false && self.members_search_server) {
                                self.workspace.query.action.get(self.search_path, { async: false, success: function(response, model) {
                                    searchlist = model;
                                }, data: { search: request.term, searchlimit: self.members_search_limit }});

                                response( $.map( searchlist, function( item ) {
                                    return {
                                                        label: item.caption ,
                                                        value: item.uniqueName
                                    };
                                }));

                            } else {
                            */
                            var search_target = self.show_unique_option == false ? "caption" : "name";
                            var result =  $.map( searchlist, function( item ) {

                                            if (item[search_target].toLowerCase().indexOf(request.term.toLowerCase()) > -1) {
                                                var label = self.show_unique_option == false? item.caption : item.uniqueName;
                                                var value = self.show_unique_option == false? item.uniqueName : item.caption;


                                                return {
                                                    label: label,
                                                    value: value
                                                };
                                            }
                                    });
                            response( result);
                    },
                    select:  function(event, ui) {
                        var value = encodeURIComponent(ui.item.value);
                        var label = ui.item.label;
                        var searchVal = self.show_unique_option == false? ui.item.value : ui.item.label;
                        var cap = self.show_unique_option == false? ui.item.label : ui.item.value;

                        $(self.el).find('.available_selections .selection_options input[value="' + encodeURIComponent(searchVal) + '"]').parent().remove();
                        $(self.el).find('.used_selections .selection_options input[value="' + encodeURIComponent(searchVal) + '"]').parent().remove();

                        var option = '<li class="option_value"><input type="checkbox" class="check_option" value="'
                                            +  encodeURIComponent(searchVal) + '" label="' + encodeURIComponent(cap)  + '">' + label + '</input></li>';





                        $(option).appendTo($(self.el).find('.used_selections .selection_options ul'));
                        $(self.el).find('.filterbox').val('');
                        ui.item.value = "";

                    }, close: function(event, ui) {
                        //$('#filter_selections').val('');
                        //$(self.el).find('.filterbox').css({ "text-align" : " left"});
                    }, open: function( event, ui ) {
                        //$(self.el).find('.filterbox').css({ "text-align" : " right"});

                    }
                });

        $(this.el).find('.filterbox').autocomplete("enable");
        if (this.selection_type === "EXCLUSION") {
            $(this.el).find('.selection_type_inclusion').prop('checked', false);
            $(this.el).find('.selection_type_exclusion').prop('checked', true);
        } else {
            $(this.el).find('.selection_type_inclusion').prop('checked', true);
            $(this.el).find('.selection_type_exclusion').prop('checked', false);
        }

        // Translate
        Saiku.i18n.translate();
        // Show dialog
        Saiku.ui.unblock();
    },

    post_render: function(args) {
        var left = ($(window).width() - 1000)/2;
        var width = $(window).width() < 1040 ? $(window).width() : 1040;
        $(args.modal.el).parents('.ui-dialog')
            .css({ width: width, left: "inherit", margin:"0", height: 585 })
            .offset({ left: left});

        $('#filter_selections').attr("disabled", false);
        $(this.el).find('a[href=#save]').focus();
        $(this.el).find('a[href=#save]').blur();
    },

    move_selection: function(event) {
        event.preventDefault();
        var action = $(event.target).attr('id');
        var $to = action.indexOf('add') !== -1 ?
            $(this.el).find('.used_selections .selection_options ul') :
            $(this.el).find('.available_selections .selection_options ul');
        var $from = action.indexOf('add') !== -1 ?
            $(this.el).find('.available_selections .selection_options ul') :
            $(this.el).find('.used_selections .selection_options ul');
        var $els = action.indexOf('all') !== -1 ?
            $from.find('li.option_value input').parent() : $from.find('li.option_value input:checked').parent();
        $els.detach().appendTo($to);
        $(this.el).find('.selection_options ul li.option_value input:checked').prop('checked', false);
        $(this.el).find('.selection_options li.all_options input').prop('checked', false);
    },

    updown_selection: function(event) {
        event.preventDefault();
        return false;
        /*
        var action = $(event.target).attr('href').replace('#','');
        if (typeof action != "undefined") {
            if ("up" == action) {
                $(this.el).find('.used_selections option:selected').insertBefore( $('.used_selections option:selected:first').prev());
            } else if ("down" == action) {
                $(this.el).find('.used_selections option:selected').insertAfter( $('.used_selections option:selected:last').next());
            }

        }
        */
    },

    click_all_member_selection: function(event, ui) {
        var checked = $(event.currentTarget).find('input').is(':checked');
        if (!checked) {
            $(event.currentTarget).parent().find('li.option_value input').removeAttr('checked');
        } else {
            $(event.currentTarget).parent().find('li.option_value input').prop('checked', true);
        }

    },

    click_move_selection: function(event, ui) {
      event.preventDefault();
      var to = ($(event.target).parent().parent().parent().parent().hasClass('used_selections')) ? '.available_selections' : '.used_selections';
      $(event.target).parent().appendTo($(this.el).find(to +' .selection_options ul'));
    },

    show_unique_action: function() {
        var self = this;
        this.show_unique_option= ! this.show_unique_option;

        if(this.show_unique_option === true) {
            $(this.el).find('.available_selections, .used_selections').addClass('unique');
            $(this.el).find('.available_selections, .used_selections').removeClass('caption');
        } else {
            $(this.el).find('.available_selections, .used_selections').addClass('caption');
            $(this.el).find('.available_selections, .used_selections').removeClass('unique');
        }

    },

    use_result_action: function() {
        this.use_result_option = !this.use_result_option;
        //console.log(this.use_result_option);
        this.get_members();
    },

    save: function() {
        var self = this;
        // Notify user that updates are in progress
        var $loading = $("<div>Saving...</div>");
        $(this.el).find('.dialog_body').children().hide();
        $(this.el).find('.dialog_body').prepend($loading);
        var show_u = this.show_unique_option;

        var hName = decodeURIComponent(self.member.hierarchy);
        var lName = decodeURIComponent(self.member.level)
        var hierarchy = self.workspace.query.helper.getHierarchy(hName);


        // Determine updates
        var updates = [];
        var totalsFunction = this.show_totals_option;

        // If no selections are used, add level
        if ($(this.el).find('.used_selections input').length === 0) {
            // nothing to do - include all members of this level
        } else {
            self.workspace.query.helper.removeAllLevelCalculatedMember(hName);

            // Loop through selections
            $(this.el).find('.used_selections .option_value input')
                .each(function(i, selection) {
                    var value = $(selection).val();
                    if($(selection).hasClass("cmember")){
                        var caption = $(selection).attr('label');

                        self.workspace.toolbar.group_parents();

                        self.workspace.query.helper.includeLevelCalculatedMember(self.axis, hName, lName, decodeURIComponent(value), 0);
                        updates.push({
                            uniqueName: decodeURIComponent(value),
                            caption: decodeURIComponent(caption),
                            type: "calculatedmember"
                        });
                    }
                    else {
                        var caption = $(selection).attr('label');
                        updates.push({
                            uniqueName: decodeURIComponent(value),
                            caption: decodeURIComponent(caption)
                        });
                    }

            });
        }


        var parameterName = $('#parameter').val();
        if (hierarchy && hierarchy.levels.hasOwnProperty(lName)) {
                hierarchy.levels[lName]["aggregators"] = [];
                if (totalsFunction) {
                    hierarchy.levels[lName]["aggregators"].push(totalsFunction);
                }
                var selectionType = $(self.el).find('input.selection_type:checked').val();
                selectionType = selectionType ? selectionType : "INCLUSION";
                hierarchy.levels[lName].selection = { "type": selectionType, "members": updates };
                if (Settings.ALLOW_PARAMETERS && parameterName) {
                    hierarchy.levels[lName].selection["parameterName"] = parameterName;
                    var parameters = self.workspace.query.helper.model().parameters;
                    if (!parameters[parameterName]) {
                    //    self.workspace.query.helper.model().parameters[parameterName] = "";
                    }


                }

        }

        this.finished();
    },

    finished: function() {
        $('#filter_selections').remove();
        this.available_members = null;
        $(this.el).find('.filterbox').autocomplete('destroy').remove();
        $(this.el).dialog('destroy');
        $(this.el).remove();
        this.query.run();
    }
});

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
 * Dialog for member selections
 */
var DrillthroughModal = Modal.extend({
	type: "drillthrough",

	buttons: [
		{ text: "Ok", method: "ok" },
		{ text: "Cancel", method: "close" }
	],

	events: {
		'click .collapsed': 'select',
		'click .expand': 'select',
		'click .folder_collapsed': 'select',
		'click .folder_expanded': 'select',
		'click .dialog_footer a' : 'call',
		'click .parent_dimension input' : 'select_dimension',
		'click .measure_tree input' : 'select_measure',
		'click input.all_measures' : 'select_all_measures',
		'click input.all_dimensions' : 'select_all_dimensions'
	},

	allMeasures: false,

	templateContent: function() {
		return $("#template-drillthrough").html();
	},



	initialize: function(args) {
		// Initialize properties
		_.extend(this, args);
		this.options.title = args.title;
		this.query = args.workspace.query;

		this.position = args.position;
		this.action = args.action;
		Saiku.ui.unblock();
		_.bindAll(this, "ok", "drilled", "template");

		// Resize when rendered

		this.render();
		// Load template
		$(this.el).find('.dialog_body')
			.html(_.template(this.templateContent())(this));
		// Show dialog
		$(this.el).find('.maxrows').val(this.maxrows);

		var schema = this.query.get('schema');

		var container = $("#template-drillthrough-list").html();

		var cubeModel = Saiku.session.sessionworkspace.cube[key];
		var dimensions = null;
		var measures = null;
		var key = this.workspace.selected_cube;

		if (cubeModel && cubeModel.has('data')) {
			dimensions = cubeModel.get('data').dimensions;
			measures = cubeModel.get('data').measures;
		}

		if (!cubeModel || !dimensions || !measures) {
			if (typeof localStorage !== "undefined" && localStorage && localStorage.getItem("cube." + key) !== null) {
				Saiku.session.sessionworkspace.cube[key] = new Cube(JSON.parse(localStorage.getItem("cube." + key)));
			} else {
				Saiku.session.sessionworkspace.cube[key] = new Cube({ key: key });
				Saiku.session.sessionworkspace.cube[key].fetch({ async : false });
			}
			dimensions = Saiku.session.sessionworkspace.cube[key].get('data').dimensions;
			measures = Saiku.session.sessionworkspace.cube[key].get('data').measures;
		}

		var templ_dim =_.template($("#template-drillthrough-dimensions").html())({dimensions: dimensions});
		var templ_measure =_.template($("#template-drillthrough-measures").html())({measures: measures, allMeasures: this.allMeasures});

		$(container).appendTo($(this.el).find('.dialog_body'));
		$(this.el).find('.sidebar').height(($("body").height() / 2) + ($("body").height() / 6) );
		$(this.el).find('.sidebar').width(380);

		$(this.el).find('.dimension_tree').html('').append($(templ_dim));
		$(this.el).find('.measure_tree').html('').append($(templ_measure));

		Saiku.i18n.translate();
	},

	select: function(event) {
		var $target = $(event.target).hasClass('root')
			? $(event.target) : $(event.target).parent().find('span');
		if ($target.hasClass('root')) {
			$target.find('a').toggleClass('folder_collapsed').toggleClass('folder_expand');
			$target.toggleClass('collapsed').toggleClass('expand');
			$target.parents('li').find('ul').children('li').toggle();
		}

		return false;
	},

	select_dimension: function(event) {
		var $target = $(event.target);
		var checked = $target.is(':checked');
		$target.parent().find('input').attr('checked', checked);
	},

	select_all_dimensions: function(event) {
		var $target = $(event.target);
		var checked = $target.is(':checked');
		$(this.el).find('.dimension_tree input').attr('checked', checked);
	},

	select_all_measures: function(event) {
		var $target = $(event.target);
		var checked = $target.is(':checked');
		$(this.el).find('.measure_tree input').attr('checked', checked);
	},

	select_measure: function(event) {
		var $target = $(event.target);
		var checked = $target.is(':checked');
		if(checked) {
			//$target.parent().siblings().find('input').attr('checked', false);
		}
	},



	ok: function() {
		if(typeof ga!= 'undefined'){
			ga('send', 'event', 'Drillthrough', 'Execute');
		}
		// Notify user that updates are in progress
		var $loading = $("<div>Drilling through...</div>");
		$(this.el).find('.dialog_body').children().hide();
		$(this.el).find('.dialog_body').prepend($loading);
		var selections = "";
		$(this.el).find('.check_level:checked').each( function(index) {
			if (index > 0) {
				selections += ", ";
			}
			selections += $(this).val();
		});

		var maxrows = $(this.el).find('.maxrows').val();
		var params = "?maxrows=" + maxrows;
		params = params + (typeof this.position !== "undefined" ? "&position=" + this.position : "" );
		params += "&returns=" + selections;
		if (this.action == "export") {
			var location = Settings.REST_URL +
				"api/query/" +
				this.query.id + "/drillthrough/export/csv" + params;
			this.close();
			window.open(location);
		} else if (this.action == "table") {
			Saiku.ui.block("Executing drillthrough...");
			this.query.action.gett("/drillthrough", { data: { position: this.position, maxrows: maxrows , returns: selections}, success: this.drilled } );
			this.close();
		}

		return false;
	},

	drilled: function(model, response) {
		var html = "";
		if (response != null && response.error != null) {
			html = safe_tags_replace(response.error);
		} else {
			var tr = new SaikuTableRenderer();
			html = tr.render(response);
		}

		//table.render({ data: response }, true);


		Saiku.ui.unblock();
		var html = '<div id="fancy_results" class="workspace_results" style="overflow:visible">' + html + '</div>';
		this.remove();
		$.fancybox(html
			,
			{
				'autoDimensions'    : false,
				'autoScale'         : false,
				'height'            :  ($("body").height() - 100),
				'width'             :  ($("body").width() - 100),
				'transitionIn'      : 'none',
				'transitionOut'     : 'none'
			}
		);

	},

	finished: function() {
		$(this.el).dialog('destroy').remove();
		this.query.run();
	}
});
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
 * Dialog for member selections
 */
var DrillAcrossModal = DrillthroughModal.extend({

	allMeasures: true,

	templateContent: function() {
		return $("#template-drillacross").html();
	},

	ok: function() {
	if(typeof ga!= 'undefined'){	
		ga('send', 'event', 'DrillAcross', 'Execute');
		}
		var self = this;
		var selections = {};
		$(this.el).find('.check_level:checked').each( function(index) {
			var key = $(this).attr('key');
			if (!selections[key]) {
				selections[key] = [];
			}
			selections[key].push($(this).val());
		});

		Saiku.ui.block("Executing drillacross...");
		this.query.action.post("/drillacross", { data: { position: this.position, drill: JSON.stringify(selections)}, success: function(model, response) {
			self.workspace.query.parse(response);
			self.workspace.unblock();
			self.workspace.sync_query();
			self.workspace.query.run();
		}, error: function(a, b, errorThrown) {
			self.workspace.unblock();
			var text = "";
			if (b && b.hasOwnProperty("responseText")) {
				text = b.responseText;
			}
			alert("Error drilling across. Check logs! " + text);
		}});
		this.close();

		return false;
	}



});
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
 * Dialog for member selections
 */
var PermissionsModal = Modal.extend({
    type: "permissions",
    
    buttons: [
        { text: "Ok", method: "ok" },
        { text: "Cancel", method: "close" }
    ],

    events: {
        'click .add_role': 'add_role',
        'click .remove_acl' : 'remove_acl',
        'submit form': 'add_role',
        'click a': 'call',
        'click input.private' : 'keep_private'

    },

    rolesacl : {},
    acltype: "SECURED",

    
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.options.title = args.title;
        this.file = args.file;
        this.rolesacl = {};
        Saiku.ui.unblock();
        _.bindAll(this, "ok", "add_role", "remove_acl");

        // Resize when rendered
        this.bind('open', Saiku.i18n.translate());
        this.render();
               // Load template
       $(this.el).find('.dialog_body')
          .html(_.template($("#template-permissions").html())(this));

        $(this.el).find('.filterbox').autocomplete({
                    minLength: 1,
                    source: Saiku.session.roles
                }).data( "autocomplete" );
        /*._renderItem = function( ul, item ) {
                return $( "<li></li>" )
                    .data( "item.autocomplete", item )
                    .append( "<a class='label'>" + item.label + "</a>" )
                    .appendTo( ul );
                };
*/
        var acl = new RepositoryAclObject({ file : this.file });
        acl.fetch({ async: false });

        var definedRoles = (typeof acl.get('roles') == "undefined" || acl.get('roles') === null ? {} : acl.get('roles')); 
        this.rolesacl = definedRoles;
        var templ_roles =_.template($("#template-permissions-rolelist").html())({roles: definedRoles });


        $(this.el).find('.rolelist').html(templ_roles);

        var owner = (typeof acl.get('owner') == "undefined" || acl.get('owner') === null ? "" : acl.get('owner')); 
        var atype = (typeof acl.get('type') == "undefined" || acl.get('type') === null ? null : acl.get('type')); 
        if (atype !== null && atype == "PRIVATE") {
            $(this.el).find('.private_owner .owner').text(owner);
            $(this.el).find('.private_owner').show();
        }
        $(this.el).find(".i18n").i18n(Saiku.i18n.po_file);
    },
    
    add_role: function(event) {
        var self = this;
        event.preventDefault();
        if (this.acltype == "PRIVATE") {
            return false;
        }
        var role = $(this.el).find(".filterbox").val();
        var acls = [];
        var aclstring ="";
        var rolecount = 0;
        if (role && role.length > 0) {
            $(this.el).find('.acl:checked').each( function(index) { 
                if (index > 0) {
                    aclstring += ", ";
                }
                rolecount++;
                aclstring += $(this).val();
                acls.push($(this).val());
            });
            if (rolecount > 0) {
                self.rolesacl[role] = acls;
                $("<option value='" + role + "'>" + role + " ["+aclstring+"]</option>").appendTo($(this.el).find(".select_roles"));
                role = $(this.el).find(".filterbox").val("");
            } else {
                alert("You need to chose at least one ACL method for this role.");
            }
        }
        

        return false;
    },

    keep_private: function(event) {
        var isPrivate = $(this.el).find('input.private').is(':checked');
        if (isPrivate) {
            $(this.el).find('.permissions').addClass('disabled_toolbar');
            $("input.acl, input.filterbox, input.add_role, input.remove_acl").prop('disabled', true);
            this.acltype = "PRIVATE";
        } else {
            $(this.el).find('.permissions').removeClass('disabled_toolbar');
            $("input.acl, input.filterbox, input.add_role, input.remove_acl").prop('disabled', false);
            this.acltype = "SECURED";
        }
    },

    remove_acl: function(event) {
        var self = this;
        if (this.acltype == "PRIVATE") {
            return false;
        }

        $(this.el).find(".select_roles option:selected").each( function(index) { 
            delete self.rolesacl[$(this).val()];
        });
        $(this.el).find(".select_roles option:selected").remove();
        return false;
    },

    ok: function() {
        var closer = this.close();
        var acl = {};
        if (this.acltype == "PRIVATE") {
            acl = { "type" : "PRIVATE", "owner" : Saiku.session.username };
        } else {
            acl = { "type" : "SECURED", "roles" : this.rolesacl, "owner" : Saiku.session.username };
        }
        (new RepositoryAclObject({ file: this.file, acl: JSON.stringify(acl)})).save({ success: closer });

        return false;
    }
});/*  
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
 * The login prompt on startup
 */
var DemoLoginForm = Modal.extend({
    type: "login",
    message: "<form id='demo_form'>" +
        "<label for='email'>Email:</label>" +
        "<input type='text' id='email' name='email' value='' />" +
        "</form>",
        
    buttons: [
        { text: "Start Demo", method: "login" }
    ],
    
    events: {
        'click a': 'call',
        'submit form ' : 'login'
    },
    
    initialize: function(args) {
        _.extend(this, args);
        _.bindAll(this, "adjust");
        this.options.title = Settings.VERSION;
        this.bind('open', this.adjust);
        var l_username = Settings.USERNAME;
        var l_password = Settings.PASSWORD;
        this.session.login(l_username, l_password);
        $(this.el).dialog('close');

    },
    
    adjust: function() {
        $(this.el).parent().find('.ui-dialog-titlebar-close').hide();
        $(this.el).find("#email").select().focus();
    },
    
    login: function(e) {
        
        var l_username = Settings.USERNAME;
        var l_password = Settings.PASSWORD;
        var email = $(this.el).find("#email").val();

        if (email) {
            var TestLog = new logger({ url: Settings.TELEMETRY_SERVER + "/input/demo" });
            TestLog.log ({
                        email: email,
                        created_at:  Math.round((new Date()).getTime() / 1000)
              }
            );
            $(this.el).dialog('close');
            this.session.login(l_username, l_password);
        }

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        return true;
    }
});
/*
 *   Copyright 2015 OSBI Ltd
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
 * The login prompt on startup
 */
var LoginForm = Modal.extend({
    type: 'login',

    message: _.template(
        '<form id="login_form">' +
            '<label for="username" class="i18n">Username</label>' +
            '<input type="text" id="username" name="username">' +
            '<label for="password" class="i18n">Password</label>' +
            '<input type="password" id="password" name="password">' +
            '<% if (Settings.EVALUATION_PANEL_LOGIN) { %>' +
                '<div class="eval-panel">' +
                    '<a href="#eval_login" class="i18n" id="eval-login">Evaluation Login</a>' +
                    '<div class="eval-panel-user clearfix" hidden>' +
                        '<ul>' +
                            '<li class="i18n">Administrator</li>' +
                            '<li class="i18n">Username: admin</li>' +
                            '<li class="i18n">Password: admin</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
            '<% } %>' +
        '</form>'
    )(),

    options: {
        autoOpen: false,
        closeOnEscape: false,
        modal: true,
        title: Settings.VERSION,
        resizable: false,
        draggable: false
    },

    buttons: [
        { text: 'Login', method: 'login' },
        { text: 'Upload License', method: 'upload_license' },
    ],

    events: {
        'click .dialog_footer a'  : 'call',
        'keyup #login_form input' : 'check',
        'click #eval-login'       : 'show_panel_user',
        'click .clearlink'        : 'clear_login'
    },

    initialize: function(args) {
        _.extend(this, args);
        _.bindAll(this, 'adjust');
        // this.options.title = Settings.VERSION;
        this.bind('open', this.adjust);
    },

    adjust: function() {
        this.$el.parent().find('.ui-dialog-titlebar-close').hide();
        this.$el.find('#username').focus();
        this.$el.find('.dialog_footer').find('a[href="#upload_license"]').hide();
    },

    check: function(event) {
        if (event.which === 13) {
            this.login();
        }
    },

    login: function() {
        var l_username = this.$el.find('#username').val();
        var l_password = this.$el.find('#password').val();
        this.$el.dialog('close');
        this.session.login(l_username, l_password, this.$el);
        return true;
    },

    clear_login: function(event) {
        window.open('/clear.html', '_blank');
    },

    setMessage: function(message) {
        this.$el.find('.dialog_body').html(this.message);
    },

	setError: function(message) {
        this.$el.find('.dialog_response').html(message);
        if (message === 'license expired') {
            this.$el.find('.dialog_footer').find('a[href="#upload_license"]').show();
        }
        this.$el.find('.clearlink').unbind();
    },

    show_panel_user: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        $currentTarget.next().slideToggle('fast');
    },

    upload_license: function(event) {
        event.preventDefault();
        var url = window.location;
        if (url.search === '') {
            window.open(url.href + 'upload.html', '_self');
        }
        else {
            window.open(url.origin + '/upload.html', '_self');
        }
    }
});
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
 * The "about us" dialog
 */
var AboutModal = Modal.extend({
    type: 'info',

    events: {
        'click a' : 'close'
    },

    message: Settings.VERSION + '<br>' +
        '<a href="http://saiku.meteorite.bi" target="_blank">http://saiku.meteorite.bi</a><br><br>' +
        '<h2 class="i18n">License Type</h2>'+
        '<span class="licensetype"/> - <span class="i18n">Expires:</span> <span class="licenseexpr"/><br/>'+
        '<span class="i18n">Number of users:</span> <span class="licenseuserlimit"/><br/>'+
        '<span class="i18n">Licensed to:</span> <span class="licensename"/> - <span class="licenseemail"/><br/>'+
        '<div id="licensetable">'+
        '<h2>Unlicenced User Quota</h2><br/>'+
        '<div class="table-wrapper">'+
        '<div class="table-scroll">'+
        '<table>'+
        '<thead>'+
        '<tr>'+
        '<th><span class="text">Username</span></th>'+
        '<th><span class="text">Logins Remaining</span></th>'+
        '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr id="quotareplace"/>'+
        '</tbody>'+
        '</table>'+
        '</div>'+
        '</div>'+
        '</div>'+
        '<strong><a href="http://www.meteorite.bi/saiku-pricing" class="i18n" target="_blank">Order more licenses' +
        ' here</a></strong><br/>'+
        'Powered by <img src="images/src/meteorite_free.png" width="20px"> <a href="http://www.meteorite.bi/services/consulting" target="_blank">www.meteorite.bi</a><br/>',

    initialize: function() {
        this.options.title = '<span class="i18n">About</span> ' + Settings.VERSION;
    },

    ObjectLength_Modern: function( object ) {
    return Object.keys(object).length;
    },

    ObjectLength_Legacy: function( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
    },


    render: function() {
        $(this.el).html(this.template())
            .addClass("dialog_" + this.type)
            .dialog(this.options);

        var uiDialogTitle = $('.ui-dialog-title');
        uiDialogTitle.html(this.options.title);
        uiDialogTitle.addClass('i18n');
        Saiku.i18n.translate();
        license = new License();

        if(Settings.LICENSE.expiration != undefined) {
            yourEpoch = parseFloat(Settings.LICENSE.expiration);
            var yourDate = new Date(yourEpoch);
            $(this.el).find(".licenseexpr").text(yourDate.toLocaleDateString());
        }
        if(Settings.LICENSE.licenseType != undefined) {
            $(this.el).find(".licensetype").text(Settings.LICENSE.licenseType);
            $(this.el).find(".licensename").text(Settings.LICENSE.name);
            $(this.el).find(".licenseuserlimit").text(Settings.LICENSE.userLimit);
            $(this.el).find(".licenseemail").text(Settings.LICENSE.email);
        }
        else{
            $(this.el).find(".licensetype").text("Open Source License");
        }
        ObjectLength =
            Object.keys ? this.ObjectLength_Modern : this.ObjectLength_Legacy;

        if(Settings.LICENSEQUOTA != undefined && ObjectLength(Settings.LICENSEQUOTA) > 0 ) {
            var tbl_body = "";
            var odd_even = false;
            $.each(Settings.LICENSEQUOTA, function () {
                var tbl_row = "";
                $.each(this, function (k, v) {
                    tbl_row += "<td>" + v + "</td>";
                });
                tbl_body += "<tr class=\"" + ( odd_even ? "odd" : "even") + "\">" + tbl_row + "</tr>";
                odd_even = !odd_even;
            });

            $(this.el).find("#quotareplace").replaceWith(tbl_body);

        }
        else{
            $(this.el).find("#licensetable").hide();
        }

        return this;
    },

    close: function(event) {
        if (event.target.hash === '#close') {
            event.preventDefault();
        }
        this.$el.dialog('destroy').remove();
    }
});
/*
 * Copyright 2015 OSBI Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The "over write" dialog
 */
var OverwriteModal = Modal.extend({
    type: 'info',

    message: 'Are you sure you want to overwrite the existing query?',

	buttons: [
		{ text: 'Yes', method: 'save' },
		{ text: 'No', method: 'close' }
	],

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);

        this.options.title = 'Warning';

		this.queryname   = this.name;
		this.queryfolder = this.foldername;
		this.parentobj   = this.parent;
    },

    dummy: function() { return true; },

	save: function(event) {
		event.preventDefault();
		this.parentobj.save_remote(this.queryname, this.queryfolder, this.parentobj);
		$(this.el).dialog('destroy').remove();
	}
});
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
var AddFolderModal = Modal.extend({

    type: "save",
    closeText: "Save",

    events: {
        'click .form_button': 'save',
        'submit form': 'save'
    },

    buttons: [
        { text: "OK", method: "save" }
    ],

    initialize: function(args) {
        var self = this;
        this.success = args.success;
        this.path = args.path;
        this.message = "<form id='add_folder'>" +
            "<label class='i18n' for='name'>To add a new folder, " + 
            "please type a name in the text box below:</label>" +
            "<input type='text' class='form-control newfolder' name='name' />" +
            "</form>";

        _.extend(this.options, {
            title: "Add Folder"
        });

        
        // fix event listening in IE < 9
        if(isIE && isIE < 9) {
            $(this.el).find('form').on('submit', this.save);    
        }

    },

    save: function( event ) {
        event.preventDefault( );
        var self = this;
        
        var name = $(this.el).find('input[name="name"]').val();
        var file = this.path + name;
        (new SavedQuery( { file: file , name: name} ) ).save({}, { 
            success: self.success,
            dataType: "text",
            error: this.error
        } );
        this.close();
        return false;
    },

    error: function() {
        $(this.el).find('dialog_body')
            .html("Could not add new folder");
    }


});
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
var FilterModal = Modal.extend({

    type: "filter",
    closeText: "Save",

    events: {
        //'submit form': 'save',
        'click .dialog_footer a' : 'call',
        'click .insert-member' : 'open_select_member_selector'
    },

    buttons: [
        { text: "OK", method: "save" },
        { text: "Cancel", method: "close" },
        { text: "Help", method: "help"}
    ],

    message: "",

    expression_text: function() {
        var c = "<div class='sidebar'><table" +
        " border='0px'>";
        if (this.expressionType == "Order") {
            c += "<tr><td class='col1'><label>Sort Type</label> <select class='form-control' id='fun'><option>ASC</option><option>BASC</option><option>DESC</option><option>BDESC</option> </select></td></tr>";
        }
        c += "<tr><td class='col1'>" + this.expressionType + " MDX Expression:</td></tr>" +
             "<tr><td class='col1' style='width:380px'><div class='filter-editor' style='width:380px' id='"+this.id+"'></div></td></tr>" +
             "</table>" +
            "<a href='#' class='form_button btn btn-default insert-member'>Insert Member</a></div>";
        return c;
    },

    expression: " ",
    expressonType: "",
    

    initialize: function(args) {
        var self = this;
        this.id = _.uniqueId('filter-modal-');
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
            $(this.el).find('.sidebar').width(380);

            this.editor = ace.edit(this.id);
            this.editor.setValue(self.expression);
            this.editor.setShowPrintMargin(false);
            this.editor.setFontSize(11);
        });


        

        
        // fix event listening in IE < 9
        if(isIE && isIE < 9) {
            $(this.el).find('form').on('submit', this.save);    
        }

    },


    save: function( event ) {
        event.preventDefault( );
        var self = this;
        this.expression = $(this.el).find('textarea').val();

        var alert_msg = "";
        if (typeof this.expression == "undefined" || !this.expression || this.expression === "") {
            alert_msg += "You have to enter a MDX expression for the " + this.expressionType + " function! ";
            alert(alert_msg);
        } else {
            if (self.expressionType == "Order") {
                var sortOrder = $('#fun').val();
                self.success(sortOrder, this.expression);
            } else {
                self.success(this.expression);
            }
            this.close();    
        }
        
        return false;
    },

    error: function() {
        $(this.el).find('dialog_body')
            .html("Could not add new folder");
    },

    /**
     * Open the select member dialog
     * @param event
     */
    open_select_member_selector: function(event){
        event.preventDefault();
        var dimension = {
            val: this.$el.find('#cms-dimension option:selected').val(),
            txt: this.$el.find('#cms-dimension option:selected').text(),
            dataDimension: this.$el.find('#cms-dimension option:selected').data('dimension'),
            dataType: this.$el.find('#cms-dimension option:selected').data('type')
        };
        var editor = ace.edit(this.id);
        var that = this;


         (new ParentMemberSelectorModal({
                dialog: this,
                workspace: this.workspace,
                cube: this.workspace.selected_cube,
                dimensions: Saiku.session.sessionworkspace.cube[this.workspace.selected_cube].get('data').dimensions,
                selectDimension: dimension.val,
                dimension: dimension.dataDimension,
                hierarchy: dimension.txt,
                uniqueName: this.pmUniqueName,
                lastLevel: this.pmLevel,
                breadcrumbs: this.pmBreadcrumbs,
                select_type: "select_member",
                selected_member: this.selected_member,
                close_callback: function(args){
                    var e = editor;
                    that.close_select_modal(e, args);
                }
            })).render().open();

            this.$el.parents('.ui-dialog').find('.ui-dialog-title').text('Custom Filter');


    },

    /**
     * Callback to update the editor with the selected member.
     * @param editor
     * @param n
     */
    close_select_modal: function(editor, n){
        editor.insert(n);
    },

    help: function(){
        window.open("http://wiki.meteorite.bi/display/SAIK/Filtering");
    }

});
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
var CustomFilterModal = Modal.extend({

    type: "filter",
    closeText: "Save",

    events: {
        'submit form': 'save',
        'change .function' : 'switch_function',
        'change .type' : 'switch_type',
        'click .dialog_footer a' : 'call'
    },

    buttons: [
        { text: "OK", method: "save" },
        { text: "Cancel", method: "close" }
    ],

    message: "<form id='custom_filter'>" + 
                     "<table border='0px'>" + 
                     "<tr><td class='col0'>Define Filter" +
                     "<select class='form-control function'><option>Select a Function...</option>" +
                     "<option value='TopCount'>TopCount</option>" +
                        "<option value='TopPercent'>TopPercent</option><option value='TopSum'>TopSum</option>" + 
                        "<option value='BottomCount'>BottomCount</option><option value='BottomPercent'>BottomPercent</option>" + 
                        "<option value='BottomSum'>BottomSum</option></select></td></tr>" + 
                     "<tr class='filter_details hide'><td><span class='ntype'></span>" +
                     "<input class='n form-control' /></td></tr>" +
                     "<tr class='filter_details hide'><td>Sort by" +
                     "<select class='type form-control'><option value='measure'>Measure</option>" +
                     "<option value='custom'>MDX Expression</option></select></td></tr>" +
                     "<tr class='filter_details hide sortingoption'><td>&nbsp; &nbsp;</td>" +
                     "</table></form>",


    func: null,
    func_type: 'Measure',
    n: "",
    sortliteral: "",
    measure_list: null,

    initialize: function(args) {
        var self = this;
        this.axis = args.axis;
        this.measures = args.measures;
        this.query = args.query;
        this.success = args.success;
        this.func = args.func;
        this.n = args.n;
        this.sortliteral = args.sortliteral;
        this.isMdx = true;
        _.bindAll(this, "build_measures_list", "save");

        this.measure_list = this.build_measures_list();

        _.extend(this.options, {
            title: "Custom Filter for " + this.axis
        });

        this.bind( 'open', function( ) {
            if (self.func !== null) {
                $(self.el).find('.function').val(self.func);
                self.switch_function({ target : $(self.el).find('.function')});
                $(self.el).find('.n').val(self.n);
                if (self.isMdx === true && self.sortliteral !== null) {
                    $(this.el).find('.type').val('custom');
                    $(this.el).find('.sortingoption').html('').html("<textarea class='form-control sortliteral'>" + self.sortliteral + "</textarea>");
                }
            }

        });
        

        
        // fix event listening in IE < 9
        if(isIE && isIE < 9) {
            $(this.el).find('form').on('submit', this.save);    
        }

    },

    build_measures_list: function() {
        var self = this;
        if (this.measure_list !== null)
            return "";
        var tmpl = "<select class='form-control sortliteral'>";
        _.each(this.measures, function(measure) {
            var selected = "";
            if (measure.uniqueName == self.sortliteral) {
                selected = " selected ";
                self.isMdx = false;
            }
            tmpl += "<option " + selected + "value='" + measure.uniqueName + "'>" + measure.caption + "</option>";
        });
        tmpl += "</select>";
        return tmpl;
    },

    switch_function: function(event) {
        var val = $(event.target).val();
        if (typeof val == "undefined" || val === "") {
            $(this.el).find('.filter_details').hide();
        } else {
            var ntype = val.replace('Top','').replace('Bottom','');
            $(this.el).find('.ntype').html(ntype + ":");
            $(this.el).find('.filter_details').show();
            $(this.el).find('.sortingoption').html('').html(this.measure_list);
        }
        return false;

    },

    switch_type: function(event) {
        var sortingoption = $(event.target).val();
        if (sortingoption == "measure") {
            $(this.el).find('.sortingoption').html('').html(this.measure_list);    
        } else {
            $(this.el).find('.sortingoption').html('').html("<textarea class='form-control sortliteral' />");
        }
        
        return false;

    },

    save: function( event ) {
        event.preventDefault( );
        var self = this;
        this.func = $(this.el).find('.function').val();
        this.n = parseInt($(this.el).find('.n').val());
        this.sortliteral = $(this.el).find('.sortliteral').val();

        var alert_msg = "";
        if (typeof this.n == "undefined" || !this.n) {
            alert_msg += "You have to enter a numeric for N! ";
        }
        if (typeof this.sortliteral == "undefined" || !this.sortliteral || this.sortliteral === "") {
            alert_msg += "You have to enter a MDX expression for the sort literal! ";
        }
        if (alert_msg !== "") {
            alert(alert_msg);
        } else {
            self.success(this.func, this.n, this.sortliteral);
            this.close();    
        }
        
        return false;
    },

    error: function() {
        $(this.el).find('dialog_body')
            .html("Could not add new folder");
    }


});
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
var MeasuresModal = Modal.extend({

    type: "filter",
    closeText: "Save",

    mdxFunctions: ['distinct', 'count distinct'],

    events: {
        'submit form': 'save',
        'click .dialog_footer a': 'call',
        'change #Measures': 'addMeasureToCalculationField',
        'click .form_button.mathBtn': 'addMathOperatorToCalculationField',
        'click .form_button.growthBtn': 'openGrowthModal',
        'click .form_button.formatBtn': 'openFormatModal'

    },

    buttons: [
        { text: "OK", method: "save" },
        { text: "Cancel", method: "close" }
    ],

    addMeasureTemplate: _.template("<form id='measure_form'>" +

        "<table border='0px'>" +
        "<tr><td class='col0 i18n'>Name:</td>" +
        "<td class='col1'><input type='text' class='measure_name' value='Measure Name'></input></td></tr>" +
            "<tr><td class='col0 i18n'>Measure:</td>" +
            "<td class='col1'>" +
            "<select id='Measures' name='MeasuresId'> " +
            "    <option value='' selected='selected'>--select an existing measure--</option> " +
            "    <% _(measures).each(function(m) { %> " +
            "      <option value='<%= m.uniqueName %>'><%= m.name %></option> " +
            "    <% }); %> " +
            "</select> " +
            "</td></tr>" +

            "<tr><td class='col0 i18n'>Formula:</td>" +
            "<td class='col1'><textarea class='measureFormula auto-hint' placeholder='Start writing a calculated measure or use the dropdown list'></textarea></td></tr>" +

            "<tr> <td class='col0'> </td>" +
            "<td class='col1'>" +
            " <form> <input type='button' class='form_button mathBtn' style='padding-bottom: 18px;' value='+' id='plusBtn' >  </input>   " +
            " <input type='button' class='form_button mathBtn' style='padding-bottom: 18px;' value='-' id='minusBtn' > </input>  " +
            " <input type='button' class='form_button mathBtn' style='padding-bottom: 18px;' value='*' id='multiplyBtn' >  </input>  " +
            " <input type='button' class='form_button mathBtn' style='padding-bottom: 18px;' value='/' id='divisionBtn' >  </input> " +
            " <input type='button' class='form_button mathBtn' style='padding-bottom: 18px;' value='(' id='leftBracketBtn' >  </input> " +
            " <input type='button' class='form_button mathBtn' style='padding-bottom: 18px;' value=')' id='rightBracketBtn' >  </input> " +

            "</form> </td>" +
            "</tr>" +

//            "<tr><td class='col0 i18n'>Function:</td>" +
//            "<td class='col1'>" +
//            "<select id='mdxFunction' name='mdxFunctionId'> " +
//            "    <option value='' selected='selected'>--select a MDX function--</option> " +
//            "    <% _(mdxFunctions).each(function(mdxFunction) { %> " +
//            "      <option value='<%= mdxFunction %>'><%= mdxFunction %></option> " +
//            "    <% }); %> " +
//            "</select> " +
//            "</td></tr>" +

            "<tr><td class='col0 i18n'>Format:</td>" +
            "<td class='col1'><input class='measure_format' type='text' value='#,##0.00'></input></td></tr>" +
            "</table></form>"
    ),


    measure: null,

    initialize: function (args) {
        var self = this;
        this.workspace = args.workspace;
        this.measure = args.measure;

        var selectedHierarchies = this.workspace.query.helper.model().queryModel.axes.ROWS.hierarchies.concat(this.workspace.query.helper.model().queryModel.axes.COLUMNS.hierarchies);
        this.selectedDimensions = this.extractDimensionChoices(selectedHierarchies);
        this.selectedRowDimensions = this.extractDimensionChoices(this.workspace.query.helper.model().queryModel.axes.ROWS.hierarchies);
        this.selectedColumnDimensions = this.extractDimensionChoices(this.workspace.query.helper.model().queryModel.axes.COLUMNS.hierarchies);
        this.selectedMeasures = this.workspace.query.helper.model().queryModel.details.measures;

        var cube = this.workspace.selected_cube;
        this.measures = Saiku.session.sessionworkspace.cube[cube].get('data').measures;

        _.bindAll(this, "save", "openGrowthModal", "openFormatModal");


        this.options.title = "Calculated Measure";

        if (this.measure) {
            _.extend(this.options, {
                title: "Custom Filter for " + this.axis
            });
        }

        this.bind('open', function () {
            if (self.measure) {
            }

        });


        // fix event listening in IE < 9
        if (isIE && isIE < 9) {
            $(this.el).find('form').on('submit', this.save);
        }
        ;

        // Load template
        this.message = this.addMeasureTemplate({
            measures: this.measures,
            mdxFunctions: this.mdxFunctions
        });

    },


    save: function (event) {
        event.preventDefault();
        var self = this;
        var measure_name = $(this.el).find('.measure_name').val();
        var measure_formula = $(this.el).find('.measureFormula').val();
        var measure_format = $(this.el).find('.measure_format').val();


        var alert_msg = "";
        if (typeof measure_name == "undefined" || !measure_name) {
            alert_msg += "You have to enter a name for the measure! ";
        }
        if (typeof measure_formula == "undefined" || !measure_formula || measure_formula === "") {
            alert_msg += "You have to enter a MDX formula for the calculated measure! ";
        }
        if (alert_msg !== "") {
            alert(alert_msg);
        } else {
            var m = { name: measure_name, formula: measure_formula, properties: {}, uniqueName: "[Measures]." + measure_name };
            if (measure_format) {
                m.properties.FORMAT_STRING = measure_format;
            }
            self.workspace.query.helper.addCalculatedMeasure(m);
            self.workspace.sync_query();
            this.close();
        }

        return false;
    },

    error: function () {
        $(this.el).find('dialog_body')
            .html("Could not add new folder");
    },

    addMathOperatorToCalculationField: function (event) {
        var mathOperator = ' ' + event.target.value + ' ';
        $(".measureFormula").val($(".measureFormula").val() + mathOperator);
    },

    addMeasureToCalculationField: function (event) {
        var measureName = this.$("#Measures option:selected").text();
        measureName = this.surroundWithSquareBrackets("Measures") + '.' + this.surroundWithSquareBrackets(measureName);
        $(".measureFormula").val($(".measureFormula").val() + measureName);
        this.resetSelectDropdown();
    },

    surroundWithSquareBrackets: function (text) {
        return '[' + text + ']';
    },

    resetSelectDropdown: function () {
        document.getElementById("Measures").selectedIndex = 0;

    },

    extractDimensionChoices: function (hierarchies) {
        dimensionNames = [];
        _.each(hierarchies, function (hierarchy) {
            dimensionNames.push(hierarchy.name)
        }, this);
        return dimensionNames;
    },

    openGrowthModal: function (event) {
        this.close();
        (new GrowthModal({
            workspace: this.workspace,
            measures: this.measures,
            dimensions: this.selectedDimensions,
            workspace: this.workspace
        })).render().open();
    },

    openFormatModal: function (event) {
        this.close();
        (new FormatAsPercentageModal({
            workspace: this.workspace,
            measures: this.selectedMeasures,
            workspace: this.workspace
        })).render().open();
    }
});
/*
 *   Copyright 2015 OSBI Ltd
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
 * @dependencies
 * - models/SaikuOlapQuery.js
 * - views/DimensionList.js
 * - views/Workspace.js
 * - views/WorkspaceDropZone.js
 * - views/WorkspaceToolbar.js
 * - css/saiku/src/saiku.dropzone.css
 * - css/saiku/src/styles.css
 * - index.html
 */

/**
 * Class for calculated measure/member
 *
 * @class CalculatedMemberModal
 */
var CalculatedMemberModal = Modal.extend({

    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
    type: 'calculated-member',

    /**
     * Property with main template of modal
     *
     * @property template_modal
     * @type {String}
     * @private
     */
    template_modal: _.template(
        '<div class="cms-container-group">' +
            '<div class="calculated-measure-group">' +
                '<h4 class="i18n">Calculated Measures:</h4>' +
                '<div class="cms-box">' +
                    '<table class="cms-list measures-list">' +
                        '<%= tplCalculatedMeasures %>' +
                    '</table>' +
                '</div>' +
            '</div>' +
            '<div class="calculated-member-group">' +
                '<h4 class="i18n">Calculated Members:</h4>' +
                '<div class="cms-box">' +
                    '<table class="cms-list members-list">' +
                        '<%= tplCalculatedMembers %>' +
                    '</table>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="cms-container-form">' +
            '<form class="form-group-inline" data-action="cad">' +
                '<div class="form-group"><label for="cms-name" class="i18n">Name:</label>' +
                '<input type="text" class="form-control" id="cms-name" autofocus></div>' +
                '<div class="cms-measure form-inline" style="padding-bottom:10px;">' +
                '<label for="cms-measure" class="i18n">Insert Member:</label>' +
                ' <input type="button" class="form-control btn-primary btn btn-select-member"' +
                ' value="Select Member" title="Insert a member into the formula editor "   ' +
                'id="insertmember"> </input> </div>' +
                '<label for="<%= idEditor %>" class="i18n">Formula:</label>' +
                '<div class="formula-editor" style="padding-bottom:10px" id="<%= idEditor %>"></div>' +
                '<div class="btn-groups">' +

                    '<a class="form_button btn btn-default minimal_padding btn-math" href="#add_math_operator_formula"' +
                            ' data-math="+">&nbsp;+&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding" href="#add_math_operator_formula"' +
        ' data-math="-">&nbsp;-&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding" href="#add_math_operator_formula"' +
        ' data-math="*">&nbsp;*&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding" href="#add_math_operator_formula"' +
        ' data-math="/">&nbsp;/&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding" href="#add_math_operator_formula"' +
        ' data-math="(">&nbsp;(&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding" href="#add_math_operator_formula"' +
        ' data-math=")">&nbsp;)&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding i18n" href="#add_math_operator_formula"' +
        ' data-math="and">&nbsp;and&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding i18n"' +
        ' href="#add_math_operator_formula" data-math="or">&nbsp;or&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-math minimal_padding i18n" href="#add_math_operator_formula"' +
                    ' data-math="not">&nbsp;not&nbsp;</a><br/>' +
                    '<div class="form-inline"><select class="cms-functionlist form-control"><option' +
                    ' value="">---Insert MDX Function---' +
                    '</select>&nbsp; <a href="" class="cms-doclink" target="_blank" style="display:' +
                    ' none;">Documentation</a><br/></div>'+
                    '</div>' +
				    '<div class="cms-function">' +
					'<label for="cms-function" class="i18n">Functions:</label>' +
					' <input type="button" class="form_button btn btn-primary growthBtn"#'+
                    ' value="Predefined Calculations"  ' +
					'         title="Calculate difference. Good to calculate previous period growth "   id="growthBtn" >  </input> ' +
					' <input type="button" class="form_button btn btn-primary formatBtn"' +
                    ' value="Format %" id="formatBtn"  ' +
					'title="Post-process step: format this view as percentage of rows, columns or grand total. " />' +
				'</div><br/>' +
                '<div style="padding-bottom:10px;"><label for="cms-dimension" class="i18n">Dimension:</label>' +
                '<select id="cms-dimension" class="form-control" style="width:365px">' +
                    '<option class="i18n" value="" selected>-- Select an existing dimension --</option>' +
                    '<% if (measures.length > 0) { %>' +
                        '<optgroup label="<%= dataMeasures.name %>">' +
                            '<option value="<%= dataMeasures.uniqueName %>" data-type="calcmeasure"><%= dataMeasures.name %></option>' +
                        '</optgroup>' +
                    '<% } %>' +
                    '<% _(dimensions).each(function(dimension) { %>' +
                        '<optgroup label="<%= dimension.name %>">' +
                            '<% _(dimension.hierarchies).each(function(hierarchy) { %>' +
                                '<option value="<%= hierarchy.uniqueName %>" data-dimension="<%= dimension.name %>" data-type="calcmember"><%= hierarchy.name %></option>' +
                            '<% }); %>' +
                        '</optgroup>' +
                    '<% }); %>' +
                '</select></div>' +
                '<% if (Settings.BIPLUGIN5 == false) { %>'+
                '<div class="btn-groups" style="padding-bottom:10px">' +
                    '<a class="form_button btn btn-primary btn-parent-member" href="#add_math_operator_formula"' +
                    ' disabled>&nbsp;Parent Member Selector&nbsp;</a>' +
                    '<a class="form_button btn btn-default btn-clear-parent" href="#add_math_operator_formula"' +
                    ' disabled>&nbsp;Clear Parent Member&nbsp;</a>' +
                '</div>' +
                '<label class="i18n" for="cms-pmember">Parent Member:</label><input' +
                ' class="form-control" readonly="true" type="text"' +
                ' id="cms-pmember"><br/>'+
                '<% } %>'+
                '<div style="padding-bottom:10px;"><label for="cms-format" class="i18n">Format:</label>' +
                '<select id="cms-format" class="form-control" style="width:365px">' +
                    '<option class="i18n" value="" selected>-- Select a format --</option>' +
                    '<option class="i18n" value="custom">Custom</option>' +
                    '<option class="i18n" value="#,##0.00">#,##0.00 Decimal</option>' +
                    '<option class="i18n" value="#,###">#,### Integer</option>' +
                    '<option class="i18n" value="##.##%">##.##% Decimal percentage</option>' +
                    '<option class="i18n" value="##%">##% Integer percentage</option>' +
                    '<option class="i18n" value="mmmm dd yyyy">mmmm dd yyyy Month Day Year</option>' +
                    '<option class="i18n" value="mmmm yyyy">mmmm yyyy Month Year</option>' +
                    '<option class="i18n" value="yyyy-mm-dd">yyyy-mm-dd ISO format date</option>' +
                    '<option class="i18n" value="yyyy-mm-dd hh:mi:ss">yyyy-mm-dd hh:mi:ss Date and time</option>' +
                    '<option class="i18n" value="##h ##m">##h ##m Minutes</option>' +
                '</select></div>' +
                '<div class="div-format-custom" style="padding-bottom:10px">' +
                    '<label for="cms-format-custom" class="i18n">Format Custom:</label>' +
                    '<input type="text" class="form-control" id="cms-format-custom" value="" placeholder="Add a' +
                    ' custom format">' +
                '</div>' +
            '</form>' +
        '</div>'
    ),

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Add', method: 'save' },
        { text: 'Update', method: 'save' },
        { text: 'New', method: 'new' },
        { text: 'Cancel', method: 'close' },
        { text: 'Help', method: 'help'}
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click  .dialog_footer a'       : 'call',
        'blur   #cms-name'              : 'trigger_input_name',
        'change #cms-measure'           : 'add_measure_formula',
        'click  .btn-math'              : 'add_math_operator_formula',
        'change #cms-dimension'         : 'type_dimension',
        'change #cms-format'            : 'type_format',
        'click  .btn-action-edit'       : 'edit_cms',
        'click  .btn-action-del'        : 'show_del_cms',
		'click  .form_button.growthBtn' : 'openGrowthModal',
        'click  .form_button.formatBtn' : 'openFormatModal',
		'click  .btn-parent-member'     : 'open_parent_member_selector',
        'click  .btn-clear-parent'      : 'reset_parent_member',
        'click .cms-functionlist'       : 'change_function_list',
        'click .btn-select-member'      : 'open_select_member_selector'
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.workspace = args.workspace;
        this.options.title = 'Calculated Member';
        this.id = _.uniqueId('cms-formula-');

        var self = this;
        var cube = this.workspace.selected_cube;
        var measures = Saiku.session.sessionworkspace.cube[cube].get('data').measures;
        var dimensions = Saiku.session.sessionworkspace.cube[cube].get('data').dimensions;
        var calculatedMeasures = this.workspace.query.helper.getCalculatedMeasures();
        var calculatedMembers = this.workspace.query.helper.getCalculatedMembers();
        var $tplCalculatedMeasures = this.template_cms(calculatedMeasures, 'calcmeasure');
        var $tplCalculatedMembers = this.template_cms(calculatedMembers, 'calcmember');
        var dataMeasures = {
            name: measures ? measures[0].dimensionUniqueName.replace(/[\[\]]/gi, '') : null,
            uniqueName: measures ? measures[0].hierarchyUniqueName : null
        };

        Saiku.ui.block('<span class="i18n">Loading...</span>');

        // Load template
        this.message = this.template_modal({
            tplCalculatedMeasures: $tplCalculatedMeasures,
            tplCalculatedMembers: $tplCalculatedMembers,
            idEditor: this.id,
            measures: measures,
            dataMeasures: dataMeasures,
            dimensions: dimensions
        });

        this.bind('open', function() {
            this.populate_function_list();
            var calcHeight = this.$el.find('.cms-container-form').height();
            this.post_render();
            this.$el.find('.dialog_footer a:nth-child(2)').hide();
            this.$el.find('.dialog_footer a:nth-child(3)').hide();
            this.$el.find('.cms-container-group').height(calcHeight);
            this.$el.find('.calculated-measure-group').height(calcHeight / 2);
            this.$el.find('.calculated-member-group').height(calcHeight / 2);
            _.defer(function() {
                self.start_editor();
            });
        });

        // Listen to result event
        Saiku.session.bind('ParentMemberSelectorModal:save', this.add_selected_dimension);
    },

    add_selected_dimension: function(args) {
        console.log(args);
        args.dialog.$el.find('#cms-dimension').val(args.selectedDimension);
    },

    /**
     * Centralize dialog in screen
     *
     * @method post_render
     * @public
     */
    post_render: function() {
        var tPerc = (((($('body').height() - 570) / 2) * 100) / $('body').height());
        var lPerc = (((($('body').width() - 800) / 2) * 100) / $('body').width());

        this.$el.dialog('option', 'position', 'center');
        this.$el.parents('.ui-dialog').css({ 
            width: '800px', 
            top: tPerc + '%', 
            left: lPerc + '%' 
        });
    },

    /**
     * Start editor ace.js
     *
     * @method start_editor
     * @public
     */
    start_editor: function() {
        this.formulaEditor = ace.edit(this.id);
        this.formulaEditor.getSession().setMode('ace/mode/text');
        this.formulaEditor.getSession().setUseWrapMode(true);
        Saiku.ui.unblock();
    },

    /**
     * Template for add calculated measure/member
     *
     * @method template_cms
     * @private
     * @param  {Object} data Data calculated measures/members
     * @param  {String} type Type calcmeasure or calcmember
     * @return {String}      Template HTML
     */
    template_cms: function(data, type) {
        var self = this;
        var $tpl = '';

        if (data && data.length !== 0) {
            if (type === 'calcmeasure') {
                _.each(data, function(value) {
                    $tpl += 
                        '<tr class="row-cms-' + self.replace_cms(value.name) + '">' +
                            '<td class="cms-name">' + value.name + '</td>' +
                            '<td class="cms-actions">' +
                                '<a class="edit button sprite btn-action-edit" href="#edit_cms" data-name="' + value.name + '" data-type="calcmeasure"></a>' +
                                '<a class="delete button sprite btn-action-del" href="#show_del_cms" data-name="' + value.name + '" data-type="calcmeasure"></a>' +
                            '</td>' +
                        '</tr>';
                });
            }
            else {
                _.each(data, function(value) {
                    if(value.name.indexOf("*TOTAL_MEMBER_SEL~SUM")==-1) {
                        $tpl +=
                            '<tr class="row-cms-' + self.replace_cms(value.name) + '">' +
                            '<td class="cms-name">' + value.name + '</td>' +
                            '<td class="cms-actions">' +
                            '<a class="edit button sprite btn-action-edit" href="#edit_cms" data-name="' + value.name + '" data-type="calcmember"></a>' +
                            '<a class="delete button sprite btn-action-del" href="#show_del_cms" data-name="' + value.name + '" data-type="calcmember"></a>' +
                            '</td>' +
                            '</tr>';
                    }
                });
            }
        }
        else {
            if (type === 'calcmeasure') {
                $tpl = '<p class="msg-no-cms i18n">No calculated measures created</p>';
            }
            else {
                $tpl = '<p class="msg-no-cms i18n">No calculated members created</p>';    
            }
        }

        return $tpl;
    },

    /**
     * Replace a measure/member name and add a caractere "-"
     *
     * @method replace_cms
     * @private
     * @param  {String} name Measure/Member name
     * @return {String}      Measure/Member name
     * @example
     *     this.replace_cms('My Member 1');
     *     Output: My-Member-1
     */
    replace_cms: function(name) {
        name = name.replace(/\s/g, '-');
        return name;
    },

    /**
     * Edit calculated measure/member
     *
     * @method edit_cms
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    edit_cms: function(event) {
        event.preventDefault();
        var self = this;
        var $currentTarget = $(event.currentTarget);
        var cms = $currentTarget.data('type') === 'calcmeasure' 
            ? this.workspace.query.helper.getCalculatedMeasures() 
            : this.workspace.query.helper.getCalculatedMembers();

        this.$el.find('.cms-actions a').removeClass('on');

        _.each(cms, function(value) {
            if (value.name === $currentTarget.data('name')) {
                $currentTarget.addClass('on');
                self.$el.find('#cms-name').val(value.name);
                self.formulaEditor.setValue(value.formula);
                self.$el.find('#cms-dimension').val(value.hierarchyName);
                self.$el.find('#cms-pmember').val(value.parentMember)
                if ((0 !== $('#cms-format option[value="' + value.properties.FORMAT_STRING + '"]').length) ||
                    (value.properties.FORMAT_STRING === undefined && !(0 !== $('#cms-format option[value="' + value.properties.FORMAT_STRING + '"]').length))) {
                    self.$el.find('#cms-format').val(value.properties.FORMAT_STRING);
                    self.$el.find('.div-format-custom').hide();
                }
                else {
                    self.$el.find('#cms-format').prop('selectedIndex', 1);
                    self.$el.find('.div-format-custom').show();
                    self.$el.find('#cms-format-custom').val(value.properties.FORMAT_STRING);
                }

                self.pmUniqueName = value.parentMember || '';
                self.pmLevel = value.parentMemberLevel || '';
                self.lastLevel = value.previousLevel || '';
                self.pmBreadcrumbs = value.parentMemberBreadcrumbs || [];
                self.actualLevel = value.assignedLevel || '';
                self.type_dimension();

                self.$el.find('.form-group-inline').data('action', 'edit');
                self.$el.find('.form-group-inline').data('oldcms', value.name);
            }
        });
        this.$el.find('.dialog_footer a:nth-child(1)').hide();
        this.$el.find('.dialog_footer a:nth-child(2)').show();
        this.$el.find('.dialog_footer a:nth-child(3)').show();
    },

    /**
     * show dialog to delete calculated measure/member
     *
     * @method show_del_cms
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    show_del_cms: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        var cmsType = $currentTarget.data('type') === 'calcmeasure' ? '<span class="i18n">measure</span>' : '<span class="i18n">member</span>';
        this.$delcms = $currentTarget;
        this.new();
        (new WarningModal({
            title: '<span class="i18n">Delete Member</span>',
            message: '<span class="i18n">You want to delete this</span> ' + cmsType + ' <b>' + $currentTarget.data('name') + '</b>?',
            okay: this.del_cms,
            okayobj: this
        })).render().open();
        this.$el.parents('.ui-dialog').find('.ui-dialog-title').text('Calculated Member');
        Saiku.i18n.translate();
    },

    /**
     * Delete calculated measure/member
     *
     * @method del_cms
     * @private
     * @param  {Object} args Object `this` of class CalculatedMemberModal
     */
    del_cms: function(args) {
        args.$delcms.parent().closest('.row-cms-' + args.replace_cms(args.$delcms.data('name'))).remove();

        if (args.$delcms.data('type') === 'calcmeasure') {
            args.workspace.query.helper.removeCalculatedMeasure(args.$delcms.data('name'));
        }
        else {
            args.workspace.query.helper.removeCalculatedMember(args.$delcms.data('name'));    
        }
        
        args.workspace.sync_query();
        args.workspace.drop_zones.set_measures();
        args.new();
        if (!args.check_len_cms(args.$delcms.data('type'))) {
            if (args.$delcms.data('type') === 'calcmeasure') {
                args.$el.find('.measures-list').append('<p class="msg-no-cms i18n">No calculated measures created</p>');
            }
            else {
                args.$el.find('.members-list').append('<p class="msg-no-cms i18n">No calculated members created</p>');
            }
        }

        Saiku.i18n.translate();
    },

    /**
     * Trigger to verify if value of input name exists in calc measures or members
     *
     * @method trigger_input_name
     * @private
     */
    trigger_input_name: function() {
        var formAction = this.$el.find('.form-group-inline').data('action');
        var name = this.$el.find('#cms-name').val();
        var dimensionDataType = this.$el.find('#cms-dimension option:selected').data('type');
        var alertMsg = '';

        if (dimensionDataType === 'calcmeasure') {
            if (this.check_name_cms(dimensionDataType, name) && formAction === 'cad') {
                alertMsg = 'Exists a measure with the same name added!';
                // this.$el.find('#cms-name').focus();
            }
        }
        else if (dimensionDataType === 'calcmember') {
            if (this.check_name_cms(dimensionDataType, name) && formAction === 'cad') {
                alertMsg = 'Exists a member with the same name added!';
                // this.$el.find('#cms-name').focus();
            }
        }
        else {
            if (this.check_name_cms(dimensionDataType, name) && formAction === 'cad') {
                alertMsg = 'Exists a measure or member with the same name added!';
                // this.$el.find('#cms-name').focus();
            }
        }

        if (alertMsg !== '') {
            alert(alertMsg);
        }
    },

    /**
     * Check if calculated measure/member exists
     *
     * @method check_name_cms
     * @private
     * @param  {String} type type Type calcmeasure or calcmember
     * @param  {String} name name Measure/Member name
     * @return {Boolean}     True/False if calculated measure/member exists
     */
    check_name_cms: function(type, name) {
        var cms = type === 'calcmeasure' 
            ? this.workspace.query.helper.getCalculatedMeasures() 
            : this.workspace.query.helper.getCalculatedMembers();

        if (type === null || type === undefined) {
            var measures = this.workspace.query.helper.getCalculatedMeasures();
            var members = this.workspace.query.helper.getCalculatedMembers();
            cms = [];
            cms = cms.concat(measures, members);
        }

        for (var i = 0; i < cms.length; i++) {
            if (cms[i].name === name) {
                return true;
            }
            else {
                return false;
            }
        }
    },

    /**
     * Check if calculated measure/member length is > 0
     *
     * @method check_len_cms
     * @private
     * @param  {String}  type Type calcmeasure or calcmember
     * @return {Boolean} True/False if calculated measure/member length is > 0
     */
    check_len_cms: function(type) {
        var cms = type === 'calcmeasure' 
            ? this.workspace.query.helper.getCalculatedMeasures() 
            : this.workspace.query.helper.getCalculatedMembers();
        if (cms.length > 0) {
            return true;
        }
        else {
            return false;
        }
    },

    /**
     * Reset form
     *
     * @method reset_form
     * @private
     */
    reset_form: function() {
        this.$el.find('#cms-name').val('');
        this.$el.find('#cms-measure').prop('selectedIndex', 0);
        this.formulaEditor.setValue('');
        this.$el.find('#cms-dimension').prop('selectedIndex', 0);
        this.$el.find('#cms-format').prop('selectedIndex', 0);
        this.$el.find('.div-format-custom').hide();
        this.$el.find('#cms-format-custom').val('');
        this.reset_parent_member();
        this.type_dimension();
    },

    /**
     * Reset dropdown "Measure"
     *
     * @method reset_dropdown
     * @private
     */
    reset_dropdown: function() {
        this.$el.find('#cms-measure').prop('selectedIndex', 0);
    },

    /**
     * Reset variables of parent member
     *
     * @method reset_parent_member
     * @private
     */
    reset_parent_member: function() {
        this.pmUniqueName = '';
        this.pmLevel = '';
        this.pmBreadcrumbs = [];
        this.$el.find('#cms-pmember').val("");

    },

    /**
     * Add measure in formula
     *
     * @method add_measure_formula
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    add_measure_formula: function(event) {
        event.preventDefault();
        var measureName = this.$el.find('#cms-measure option:selected').val();
        var formula = this.formulaEditor.getValue();
        formula = formula + measureName;
        this.formulaEditor.setValue(formula);
        this.reset_dropdown();
    },

    /**
     * Add math operator in formula
     *
     * @method add_math_operator_formula
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    add_math_operator_formula: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        var formula = ' ' + $currentTarget.data('math') + ' ';
        var i = this.$el.find(".formula-editor").attr('id');
        var editor = ace.edit(i);
        editor.insert(formula);
    },

    /**
     * Type dimension - Measure/Member
     *
     * @method type_dimension
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    type_dimension: function(event) {
        var dimensionDataType = this.$el.find('#cms-dimension option:selected').data('type');

        if (event) { 
            event.preventDefault();
            this.reset_parent_member();
        }

        if (dimensionDataType === 'calcmember') {
            this.$el.find('.btn-parent-member').removeAttr('disabled');
            this.$el.find('.btn-clear-parent-member').removeAttr('disabled');
        }
        else {
            this.$el.find('.btn-parent-member').attr('disabled', 'disabled');
            this.$el.find('.btn-clear-parent-member').attr('disabled', 'disabled');
        }
    },

    /**
     * Type format - Decimal, Integer, Custom etc
     *
     * @method type_format
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    type_format: function(event) {
        event.preventDefault();
        var format = this.$el.find('#cms-format option:selected').val();
        if (format === 'custom') {
            this.$el.find('.div-format-custom').show();
        }
        else {
            this.$el.find('.div-format-custom').hide();
        }
    },

    /**
     * New calculated measure/member
     *
     * @method new
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    new: function(event) {
        if (event) { event.preventDefault(); }
        this.$el.find('.cms-actions a').removeClass('on');
        this.$el.find('.form-group-inline').data('action', 'cad');
        this.$el.find('.form-group-inline').data('oldcms', '');
        this.$el.find('.dialog_footer a:nth-child(1)').show();
        this.$el.find('.dialog_footer a:nth-child(2)').hide();
        this.$el.find('.dialog_footer a:nth-child(3)').hide();
        this.reset_form();
    },

    openGrowthModal: function (event) {
    	var selectedHierarchies = this.workspace.query.helper.model().queryModel.axes.ROWS.hierarchies.concat(this.workspace.query.helper.model().queryModel.axes.COLUMNS.hierarchies);

    	function extractDimensionChoices(hierarchies) {
    		var dimensionNames = [];
    		_.each(hierarchies, function (hierarchy) {
    			dimensionNames.push(hierarchy.name)
    		}, this);
    		return dimensionNames;
    	}

    	var selectedDimensions = extractDimensionChoices(selectedHierarchies);
    	var cube = this.workspace.selected_cube;
    	var measures = Saiku.session.sessionworkspace.cube[cube].get('data').measures;

    	this.close();
    	(new GrowthModal({
    		workspace: this.workspace,
    		measures: measures,
    		dimensions: selectedDimensions
    	})).render().open();
    },

    openFormatModal: function (event) {
    	var selectedMeasures = this.workspace.query.helper.model().queryModel.details.measures;
    	this.close();
    	(new FormatAsPercentageModal({
    		workspace: this.workspace,
    		measures: selectedMeasures
    	})).render().open();
    },

    /**
     * Show dialog for get a parent member
     *
     * @method open_parent_member_selector
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    open_parent_member_selector: function(event) {
        event.preventDefault();

        // var formAction = this.$el.find('.form-group-inline').data('action');
        var dimension = {
            val: this.$el.find('#cms-dimension option:selected').val(),
            txt: this.$el.find('#cms-dimension option:selected').text(),
            dataDimension: this.$el.find('#cms-dimension option:selected').data('dimension'),
            dataType: this.$el.find('#cms-dimension option:selected').data('type')
        };

        if (dimension.dataType === 'calcmember') {
            (new ParentMemberSelectorModal({
                dialog: this,
                workspace: this.workspace,
                cube: this.workspace.selected_cube,
                dimensions: Saiku.session.sessionworkspace.cube[this.workspace.selected_cube].get('data').dimensions,
                selectDimension: dimension.val,
                dimension: dimension.dataDimension,
                hierarchy: dimension.txt,
                uniqueName: this.pmUniqueName,
                lastLevel: this.lastLevel,
                current_level: this.pmLevel,
                breadcrumbs: this.pmBreadcrumbs
            })).render().open();

            this.$el.parents('.ui-dialog').find('.ui-dialog-title').text('Connection Details');
        }
    },

    /**
     * Save calculated member
     *
     * @method save
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    save: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        var nameOld = this.$el.find('.form-group-inline').data('oldcms');
        var name = this.$el.find('#cms-name').val();
        var formula = this.formulaEditor.getValue();
        var dimension = {
            val: this.$el.find('#cms-dimension option:selected').val(),
            txt: this.$el.find('#cms-dimension option:selected').text(),
            dataDimension: this.$el.find('#cms-dimension option:selected').data('dimension'),
            dataType: this.$el.find('#cms-dimension option:selected').data('type')
        };
        var format = this.$el.find('#cms-format option:selected').val();
        var formAction = this.$el.find('.form-group-inline').data('action');
        var alertMsg = '';
        var objMember;

        if (format === 'custom') {
            format = this.$el.find('#cms-format-custom').val();
        }
        else {
            format = this.$el.find('#cms-format option:selected').val();
        }

        if (typeof name === 'undefined' || name === '' || !name) {
            alertMsg += 'You have to enter a name for the member! ';
        }
        if (typeof formula === 'undefined' || formula === '' || !formula) {
            alertMsg += 'You have to enter a MDX formula for the calculated member! ';
        }
        if (typeof dimension.val === 'undefined' || dimension.val === '' || !dimension.val) {
            alertMsg += 'You have to choose a dimension for the calculated member! ';
        }
        if (alertMsg !== '') {
            alert(alertMsg);
        } 
        else {
            if (dimension.dataType === 'calcmeasure') {
                objMember = { 
                    name: name,
                    formula: formula, 
                    properties: {}, 
                    uniqueName: name, 
                    hierarchyName: dimension.val
                };
                
                if (format) {
                    objMember.properties.FORMAT_STRING = format;
                }

                if (formAction === 'cad') {
                    this.workspace.query.helper.addCalculatedMeasure(objMember);
                    this.workspace.sync_query();
                }
                else {
                    this.workspace.query.helper.editCalculatedMeasure(nameOld, objMember);
                    this.workspace.sync_query();
                    this.workspace.drop_zones.set_measures();
                }
            }
            else {
                objMember = { 
                    name: name,
                    dimension: dimension.dataDimension,
                    uniqueName: '[' + dimension.txt + '].[' + name + ']',
                    caption: name,
                    properties: {},
                    formula: formula,
                    hierarchyName: dimension.val,
                    parentMember: '',
                    parentMemberLevel: '',
                    previousLevel: '',
                    parentMemberBreadcrumbs: [],
                    assignedLevel: ''
                };

                if (format) {
                    objMember.properties.FORMAT_STRING = format;
                }
                
                if (this.pmUniqueName && !(_.isEmpty(this.pmUniqueName))) {
                    objMember.parentMember = this.pmUniqueName;
                    objMember.parentMemberLevel = this.pmLevel;
                    objMember.previousLevel = this.lastLevel;
                    objMember.parentMemberBreadcrumbs = this.pmBreadcrumbs;
                    objMember.uniqueName = this.pmUniqueName+".["+name+"]";
                    objMember.assignedLevel = this.actualLevel
                }
                this.workspace.query.helper.includeCmember(dimension.val, objMember.uniqueName);
                if (formAction === 'cad') {
                    this.workspace.query.helper.addCalculatedMember(objMember);
                    this.workspace.sync_query();
                }
                else {
                    this.workspace.query.helper.removeLevelCalculatedMember(dimension.val, '[' + dimension.txt + '].[' + nameOld + ']');
                    this.workspace.query.helper.editCalculatedMember(nameOld, objMember);
                    this.workspace.sync_query();
                    this.workspace.drop_zones.set_measures();
                }
            }

            this.$el.dialog('close');
        }
    },

    /**
     * Populate the MDX function select box with useful MDX constructs.
     * @param event
     */
    populate_function_list: function(event){

        var functions = [
            {name: 'Formula Not Empty Check', example:'Iif(NOT' +
            ' ISEMPTY([Measures].[My Measure]),([Measures].[My Measure] + [Numeric Expression]),null))',
                description: 'Insert a formula with an ISEMPTY check to ensure that only non null cells are' +
                ' calculated',
                doc_link:'http://wiki.meteorite.bi/display/SAIK/Non+Empty+Calculated+Members'},
            {name: 'Aggregate', example:'Aggregate(Set_Expression [ ,Numeric_Expression ])',
                description:'Returns a number that is calculated by aggregating over the cells returned by the set expression.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145524.aspx'},
            {name: 'Avg', example:'Avg( Set_Expression [ , Numeric_Expression ] )',
                description:'Evaluates a set and returns the average of the non empty values of the cells in the set, averaged over the measures in the set or over a specified measure.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms146067.aspx'},
            {name: 'Ancestor', example:'Ancestor(Member_Expression, Distance)',
                description:'A function that returns the ancestor of a specified member at a specified level or at a specified distance from the member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145616.aspx'},
            {name: 'ClosingPeriod', example:'ClosingPeriod( [ Level_Expression [ ,Member_Expression ] ] )',
                description:'Returns the member that is the last sibling among the descendants of a specified member at a specified level.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145584.aspx'},
            {name: 'Cousin', example:'Cousin( Member_Expression , Ancestor_Member_Expression )',
                description:'Returns the child member with the same relative position under a parent member as the specified child member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145481.aspx'},
            {name: 'CurrentMember', example:'Hierarchy_Expression.CurrentMember',
                description:'Returns the current member along a specified hierarchy during iteration.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms144948.aspx'},
            {name: 'FirstChild', example:'Member_Expression.FirstChild',
                description:'Returns the first child of a specified member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms144947.aspx'},
            {name: 'FirstSibling', example:'Member_Expression.FirstSibling',
                description:'Returns the first child of the parent of a member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145956.aspx'},
            {name: 'IIf', example:'IIf(Logical_Expression, Expression1, Expression2)',
                description:'Evaluates different branch expressions depending on whether a Boolean condition is true or false.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145994.aspx'},
            {name: 'LastChild', example:'Member_Expression.LastChild',
                description:'Returns the last child of a specified member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145576.aspx'},
            {name: 'LastSibling', example:'Member_Expression.LastSibling',
                description:'Returns the last child of the parent of a specified member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms144863.aspx'},
            {name: 'Max', example:'Max( Set_Expression [ , Numeric_Expression ] )',
                description:'Returns the maximum value of a numeric expression that is evaluated over a set.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145601.aspx'},
            {name: 'Median', example:'Median(Set_Expression [ ,Numeric_Expression ] )',
                description:'Returns the median value of a numeric expression that is evaluated over a set.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145570.aspx'},
            {name: 'Min', example:'Min( Set_Expression [ , Numeric_Expression ] )',
                description:'Returns the minimum value of a numeric expression that is evaluated over a set.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145600.aspx'},
            {name: 'MTD', example:'Mtd( [ Member_Expression ] )',
                description:'Returns a set of sibling members from the same level as a given member, starting with the first sibling and ending with the given member, as constrained by the Year level in the Time dimension.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms144753.aspx'},
            {name: 'OpeningPeriod', example:'OpeningPeriod( [ Level_Expression [ , Member_Expression ] ] )',
                description:'Returns the first sibling among the descendants of a specified level, optionally at a specified member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145992.aspx'},
            {name: 'ParallelPeriod', example:'ParallelPeriod( [ Level_Expression [ ,Index [ , Member_Expression ] ] ] )',
                description:'Returns a member from a prior period in the same relative position as a specified member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145500.aspx'},
            {name: 'Parent', example:'Member_Expression.Parent',
                description:'Returns the parent of a member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145513.aspx'},
            {name: 'PrevMember', example:'Member_Expression.PrevMember',
                description:'Returns the previous member in the level that contains a specified member.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms144719.aspx'},
            {name: 'QTD', example:'Qtd( [ Member_Expression ] )',
                description:'Returns a set of sibling members from the same level as a given member, starting with the first sibling and ending with the given member, as constrained by the Quarter level in the Time dimension.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145978.aspx'},
            {name: 'Sum', example:'Sum( Set_Expression [ , Numeric_Expression ] )',
                description:'Returns the sum of a numeric expression evaluated over a specified set.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms145484.aspx'},
            {name: 'WTD', example:'Wtd( [ Member_Expression ] )',
                description:'Returns a set of sibling members from the same level as a given member, starting with the first sibling and ending with the given member, as constrained by the Week level in the Time dimension.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms144930.aspx'},
            {name: 'YTD', example:'Ytd( [ Member_Expression ] )',
                description:'Returns a set of sibling members from the same level as a given member, starting with the first sibling and ending with the given member, as constrained by the Year level in the Time dimension.',
                doc_link:'https://msdn.microsoft.com/en-us/library/ms146039.aspx'}

        ]

        var option = '';
        for (var i=0;i<functions.length;i++){
            option += '<option title="'+functions[i].description+'" data-desc="'+functions[i].description+'" data-doc-link="'+functions[i].doc_link+'" ' +
                'value="'+ functions[i].example + '">' + functions[i].name + '</option>';
        }
        $('.cms-functionlist').append(option);
    },

    change_function_list: function(event){
        event.preventDefault();

        var selectedFunction = this.$el.find('.cms-functionlist option:selected');

        $('.cms-functionlist').prop('title',($(selectedFunction).prop('title')));


        if($(selectedFunction).data("doc-link")){
            $('.cms-doclink').prop('href', $(selectedFunction).data("doc-link"));
            $('.cms-doclink').show();
        }
        else{
            $('.cms-doclink').hide();
        }

        if($(selectedFunction).val()){
            var i = this.$el.find(".formula-editor").attr('id');
            var editor = ace.edit(i);
            editor.insert($(selectedFunction).val());
        }
    },

    /**
     * Open the select member dialog
     * @param event
     */
    open_select_member_selector: function(event){
        event.preventDefault();
        var dimension = {
            val: this.$el.find('#cms-dimension option:selected').val(),
            txt: this.$el.find('#cms-dimension option:selected').text(),
            dataDimension: this.$el.find('#cms-dimension option:selected').data('dimension'),
            dataType: this.$el.find('#cms-dimension option:selected').data('type')
        };
        var i = this.$el.find(".formula-editor").attr('id');
        var editor = ace.edit(i);
        var that = this;
        var $currentTarget = $(event.currentTarget);


        if($currentTarget.hasClass("btn-select-member")){
            (new ParentMemberSelectorModal({
                dialog: this,
                workspace: this.workspace,
                cube: this.workspace.selected_cube,
                dimensions: Saiku.session.sessionworkspace.cube[this.workspace.selected_cube].get('data').dimensions,
                selectDimension: dimension.val,
                dimension: dimension.dataDimension,
                hierarchy: dimension.txt,
                uniqueName: this.pmUniqueName,
                lastLevel: this.pmLevel,
                breadcrumbs: this.pmBreadcrumbs,
                select_type: "select_member",
                selected_member: this.selected_member,
                close_callback: function(args){
                    var e = editor;
                    that.close_select_modal(e, args);
                }
            })).render().open();

            this.$el.parents('.ui-dialog').find('.ui-dialog-title').text('Connection Details');
        }
        else if (dimension.dataType === 'calcmember') {
            (new ParentMemberSelectorModal({
                dialog: this,
                workspace: this.workspace,
                cube: this.workspace.selected_cube,
                dimensions: Saiku.session.sessionworkspace.cube[this.workspace.selected_cube].get('data').dimensions,
                selectDimension: dimension.val,
                dimension: dimension.dataDimension,
                hierarchy: dimension.txt,
                uniqueName: this.pmUniqueName,
                lastLevel: this.lastLevel,
                current_level: this.pmLevel,
                breadcrumbs: this.pmBreadcrumbs
            })).render().open();

            this.$el.parents('.ui-dialog').find('.ui-dialog-title').text('Connection Details');
        }

    },

    /**
     * Callback to update the editor with the selected member.
     * @param editor
     * @param n
     */
    close_select_modal: function(editor, n){
        editor.insert(n);
    },

    help: function(){
        window.open("http://wiki.meteorite.bi/display/SAIK/Calculated+Members");
    }
});
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
 * Dialog to calculate 'previous member' growth. Use case: if business users want to calculate difference between two periods, they can use this screen.
 */
var GrowthModal = Modal.extend({

	type: "filter",
	closeText: "Save",

	measureExpression: "",
	selectedMeasure: "",
	selectedDimension: "",
	asPercent: false,
	asPercentAround100: false,
	asPercentAlternative: false,

	events: {
		'click .dialog_footer a': 'call',
		'submit form': 'save',
		'change #Measures': 'addMeasureToCalculationField',
		'change #Dimensions': 'addDimensionToCalculationField',
		'click [type="checkbox"]': 'setAbsoluteOrRelative'

	},

	buttons: [
		{text: "OK", method: "save"},
		{text: "Cancel", method: "close"}
	],

	addMeasureTemplate: _.template(
		"<span> Calculate difference of a measure over dimension members </span>" +
		"<form id='measureGrowthForm'>" +
		"<table border='0px'>" +
		"<tr><td class='col0 i18n'>Name:</td>" +
		"<td class='col1'><input type='text' class='form-control measure_name' value='Measure Name'></input></td></tr>" +

		'<input type="checkbox" name="asPercent" value="asPercent" id="asPercentCheckbox"> Relative %? <br>' +
		'<% if(dimensions.length<2){ %>'+
		'<input type="checkbox" name="asPercentAlt" disabled value="asPercentAlt" id="asPercentAltCheckbox"> % of Measure<br>' +
		'<% }  else {%>'+
		'<input type="checkbox" name="asPercentAlt" value="asPercentAlt" id="asPercentAltCheckbox"> % of Measure<br>' +
		'<% }%>'+
		'<input type="checkbox" name="asPercentAround100" value="asPercentAround100" id="asPercentAround100Checkbox"> Relative around 100%? <br>' +

		"<tr><td class='col0 i18n'>Measure:</td>" +
		"<td class='col1'>" +
		"<select id='Measures' class='form-control' name='MeasuresId' title='Select the measure from which the difference should be calculated'> " +
		"    <option value='' selected='selected'>--select an existing measure--</option> " +
		"    <% _(measures).each(function(m) { %> " +
		"      <option value='<%= m.uniqueName %>'><%= m.name %></option> " +
		"    <% }); %> " +
		"</select> " +
		"</td></tr>" +

		"<tr><td class='col0 i18n'>Dimension:</td>" +
		"<td class='col1'>" +
		"<select id='Dimensions' name='DimensionsId' class='form-control' title='This dimension attribute is used to calculate the difference of the selected measure. E.g. Calculate the growth over the years.'> " +
		"    <option value='' selected='selected'>--select a dimension from your query--</option> " +
		"    <% _(dimensions).each(function(dim) { %> " +
		"      <option value='<%= dim %>'><%= dim %></option> " +
		"    <% }); %> " +
		"</select> " +
		"</td></tr>" +

		"<tr><td class='col0 i18n'>Format:</td>" +
		"<td class='col1'><input class='measure_format' type='text' class='form-control' value='#,##0.00'></input></td></tr>" +

		"<tr><td class='col0 i18n'>Formula:</td>" +
		"<td class='col1'><textarea class='measureFormula auto-hint' class='form-control' placeholder='This field will automatically be constructed by selecting a measure and growth dimension from the dropdown lists above...'>" +
		"</textarea></td></tr>" +

		"</table></form>"
	),

	initialize: function (args) {
		var self = this;
		this.measures = args.measures;
		this.dimensions = args.dimensions;
		this.workspace = args.workspace

		_.bindAll(this, "save", "addMeasureToCalculationField", "addDimensionToCalculationField", "updateCalculatedMemberField", "setAbsoluteOrRelative", "updateFormatField");

		// fix event listening in IE < 9
		if (isIE && isIE < 9) {
			$(this.el).find('form').on('submit', this.save);
		}

		// Load template
		this.message = this.addMeasureTemplate({
			measures: this.measures,
			dimensions: this.dimensions,
			measureExpression: this.measureExpression
		});


		this.$el.find('.dialog_icon')

	},

	save: function (event) {
		event.preventDefault();
		var self = this;
		var measure_name = $(this.el).find('.measure_name').val();
		var measure_formula = $(this.el).find('.measureFormula').val();
		var measure_format = $(this.el).find('.measure_format').val();


		var alert_msg = "";
		if (typeof measure_name == "undefined" || !measure_name) {
			alert_msg += "You have to enter a name for the measure! ";
		}
		if (typeof measure_formula == "undefined" || !measure_formula || measure_formula === "") {
			alert_msg += "You have to enter a MDX formula for the calculated measure! ";
		}
		if (alert_msg !== "") {
			alert(alert_msg);
		} else {
			if(!this.asPercentAlternative) {
				var m = {
					name: measure_name,
					formula: measure_formula,
					properties: {},
					uniqueName: "[Measures]." + measure_name
				};
				if (measure_format) {
					m.properties.FORMAT_STRING = measure_format;
				}
				self.workspace.query.helper.addCalculatedMeasure(m);
			}
			else{
				_.each(this.memberExpression, function(m2){
					var m = {
						name: m2.name,
						dimension: m2.dimension,
						uniqueName: m2.uniqueName,
						caption: "*TOTAL_MEMBER_SEL~SUM",
						properties: {},
						formula: m2.statement,
						hierarchyName: m2.hierarchy,
						parentMember: '',
						parentMemberLevel: '',
						previousLevel: '',
						parentMemberBreadcrumbs: []
					};
					self.workspace.query.helper.addCalculatedMember(m);
				});



				var m2 = {
					name: measure_name,
					formula: measure_formula,
					properties: {},
					uniqueName: "[Measures]." + measure_name
				};
				if (measure_format) {
					m2.properties.FORMAT_STRING = '###0.00%';
				}
				self.workspace.query.helper.addCalculatedMeasure(m2);

			}
			self.workspace.sync_query();
			this.close();
		}

		return false;
	},
	endswith: function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
	},

	updateCalculatedMemberField: function () {
		var measure = "[Measures]." + this.surroundWithSquareBrackets(this.selectedMeasure);
		var dimIteration = this.selectedDimension + ".CurrentMember.PrevMember";
		if (this.asPercent) {
			this.measureExpression = "( IIF( IsEmpty(" + dimIteration + "),NULL, " + "( " + measure + " - (" + measure + ", " + dimIteration + ")" + ") / " + "( " + measure + ", " + dimIteration + ")))";
		}
		else if (this.asPercentAround100) {
			this.measureExpression = "( IIF( IsEmpty(" + dimIteration + "),NULL, " + "1 + ( " + measure + " - (" + measure + ", " + dimIteration + ")" + ") /" +
				" " + "( " + measure + ", " + dimIteration + ")))";
		}
		else if(this.asPercentAlternative){

			var axis = this.workspace.query.helper.getAxis("ROWS");
			var hierarchies = axis.hierarchies;
			this.memberExpression = [];

			var selected = $(this.el).find("#Dimensions").val();
			var hit = false;
				var s = this.calculate_nonempty_crossjoin(hierarchies);
				for(var i=0; i<hierarchies.length; i++){
					var h = hierarchies[i];
					if(selected === h.name){
						hit =true
					}
					else if(hit==true) {
						var generate = this.calculated_generate(s, h);
						var name = h.name;
						var dim = h.dimension;
						var obj = {
							dimension: dim,
							hierarchy: name,
							statement: "sum(" + generate + ")",
							uniqueName: name + '.[' + dim + '*TOTAL_MEMBER_SEL~SUM]',
							name: dim + "*TOTAL_MEMBER_SEL~SUM"
						};
						this.memberExpression.push(obj);
					}
				}

			var strdef="";
			_.each(this.memberExpression, function(m){
				strdef+=","+ m.uniqueName;
			});
			this.measureExpression = measure+"/("+measure+strdef+")";
		}
		else {
			this.measureExpression = "( IIF( IsEmpty(" + dimIteration + "),NULL, " + "( " + measure + " - " + "( " + measure + ", " + dimIteration + "))))";
		}

		// also update UI
		$(".measureFormula").val(this.measureExpression);
	},

	addMeasureToCalculationField: function (event) {
		this.selectedMeasure = this.$("#Measures option:selected").text();
		this.updateCalculatedMemberField();
	},

	addDimensionToCalculationField: function (event) {
		this.selectedDimension = this.$("#Dimensions option:selected").text();
		this.updateCalculatedMemberField();

	},

	setAbsoluteOrRelative: function (event) {
		var checkBox = event.target.id;
		var that = this;
		if (checkBox == "asPercentCheckbox") {
			this.asPercent = !this.asPercent;
			this.asPercentAround100 = false;
			this.asPercentAlternative = false;
			$(this.el).find("#Dimensions option").remove();
			_.each(this.dimensions, function(f){
				$(that.el).find("#Dimensions").append($("<option></option>")
					.attr("value", f)
					.text(f));
			});
			$(this.el).find("#Dimensions").find("option:last").prop('disabled', false);
		} else if (checkBox == "asPercentAround100Checkbox") {
			this.asPercentAround100 = !this.asPercentAround100;
			this.asPercent = false;
			this.asPercentAlternative = false;
			$(this.el).find("#Dimensions option").remove();
			_.each(this.dimensions, function(f){
				$(that.el).find("#Dimensions").append($("<option></option>")
					.attr("value", f)
					.text(f));
			});
			$(this.el).find("#Dimensions").find("option:last").prop('disabled', false);
		} else if (checkBox == "asPercentAltCheckbox") {
			this.asPercentAlternative = !this.asPercentAlternative;
			this.asPercent = false;
			this.asPercentAround100 = false;
			$(this.el).find("#Dimensions option").remove();
			var axis = this.workspace.query.helper.getAxis("ROWS");
			var hierarchies = axis.hierarchies;
			_.each(hierarchies, function(f){
				$(that.el).find("#Dimensions").append($("<option></option>")
					.attr("value", f.name)
					.text(f.name));
			});

			$(this.el).find("#Dimensions").find("option:last").prop('disabled', true);

		}
		// keep DOM up-to-date
		$('#asPercentCheckbox').prop('checked', this.asPercent);
		$('#asPercentAround100Checkbox').prop('checked', this.asPercentAround100);
		$('#asPercentAltCheckbox').prop('checked', this.asPercentAlternative);
		this.updateCalculatedMemberField();
		this.updateFormatField();
	},

	updateFormatField: function (event) {
		if (this.asPercent || this.asPercentAround100) {
			$(".measure_format").val("0.00%");
		}
	},

	surroundWithSquareBrackets: function (text) {
		return '[' + text + ']';
	},

	calculate_nonempty_crossjoin: function(hierarchies) {


		var str;

		var memberstring1 = this.return_selected_members(hierarchies[hierarchies.length-1]);
		var memberstring2 = this.return_selected_members(hierarchies[hierarchies.length-2]);



		str="NONEMPTYCROSSJOIN("+memberstring2+","+memberstring1+")";
		if(hierarchies.length>2){



			for(var i= hierarchies.length-2; i > 0 ;--i){
				var memberstring3 = this.return_selected_members(hierarchies[i-1]);

				str="NONEMPTYCROSSJOIN("+memberstring3+","+str+")";
			}

		}

		return str;

	},

	calculated_generate: function(nonemptystr, current){
		var level1=current.name;
		return "Generate("+nonemptystr+",{"+level1+".CURRENTMEMBER})"
	},

	return_selected_members: function(hierarchy){
		var retstr="";
		var l;
		_.each(hierarchy.levels, function(level){
			l=level
		});

		if(l.selection.members.length>0){
			_.each(l.selection.members, function(member){
				retstr+=member.uniqueName+","
			});
			return "{"+retstr.substring(0, retstr.length-1)+"}";
		}
		else{
			var level1=hierarchy.levels;

			var last = Object.keys(level1)[Object.keys(level1).length-1];

			return hierarchy.name+".["+last+"].MEMBERS"
		}


	}

});
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
 *
 */
var FormatAsPercentageModal = Modal.extend({

	type: "filter",
	closeText: "Save",

	generatedMeasures: [],
	selectedMeasure: "",
	selectedDimension: "",
	asPercent: true,

	events: {
		'click .dialog_footer a': 'call',
		'click .formatButton': 'format'

	},

	buttons: [
		{text: "Cancel", method: "close"},
		{text: "Help", method: "help"}
	],

	addMeasureTemplate: _.template(
		"<div class='text'>Name: <input type='text' class='measure_name form-control'></input> </div> " +
		"<div> <span> Select how to express the measures: </span> </div>" +
		"<ol style='list-style-type: none;'> " +
		"<li style='padding-bottom: 10px; padding-right: 10px; float: inherit;'>     " +
		"    <button class='form_button btn btn-primary formatButton' id='formatOverRows'> Format as % of rows </button></li>" +
		"<li style='padding-bottom: 10px; padding-right: 10px; float: inherit;'>     " +
		"    <button class='form_button btn btn-primary formatButton' id='formatOverColumns'> Format as % of columns </button></li>" +
		"<li style='padding-bottom: 10px; padding-right: 10px; float: inherit;'>     " +
		"    <button class='form_button formatButton btn btn-primary' id='formatOverTotal'> Format as % of total </button></li>" +
		"</ol>" +
		"<span id='userFeedback'> <p> <%= userFeedback %> </p> </span>"
	),

	userFeedback: "",
	selectedRows: [],
	selectedColumns: [],

	initialize: function (args) {
		var self = this;
		this.measures = args.measures;
		this.workspace = args.workspace;

		var mdx = this.workspace.query.model.mdx;
		this.selectedRows = this.extractFromMdx(mdx, "~ROWS");
		this.selectedColumns = this.extractFromMdx(mdx, "~COLUMNS");
		this.generatedMeasures = [];

		_.bindAll(this, "save", "format");

		this.options.title = "Format as percentage";

		// fix event listening in IE < 9
		if (isIE && isIE < 9) {
			$(this.el).find('form').on('submit', this.save);
		}

		// Determine feasibility
		this.userFeedback = this.checkRowsOrColumnsPresent(this.selectedColumns, this.selectedRows);

		// Load template
		this.message = this.addMeasureTemplate({userFeedback: this.userFeedback});

		this.$el.find('.dialog_icon')

	},

	save: function (measureExpression, measureName, percentOver) {
		var self = this;
		var measure_name = $(this.el).find('.measure_name').val();
		if (measure_name == null || measure_name == "") {
			measure_name = measureName + ' % of ' + percentOver;
		}
		var measure_formula = measureExpression;
		var measure_format = '0.00%';

		var alert_msg = "";
		if (typeof measure_name == "undefined" || !measure_name) {
			alert_msg += "You have to enter a name for the measure! ";
		}
		if (typeof measure_formula == "undefined" || !measure_formula || measure_formula === "") {
			alert_msg += "You have to enter a MDX formula for the calculated measure! ";
		}
		if (alert_msg !== "") {
			alert(alert_msg);
		} else {
			var m = {name: measure_name, formula: measure_formula, properties: {}, uniqueName: "[Measures]." + measure_name};
			if (measure_format) {
				m.properties.FORMAT_STRING = measure_format;
			}
			self.workspace.query.helper.addCalculatedMeasure(m);
			this.generatedMeasures.push(m);
		}
	},

	format: function (event) {
		event.preventDefault();
		var self = this;
		var action = event.target.id;
		var formatOver = this.determineFormatOver(action);

		for (var m = 0; m < this.measures.length; m++) {
			var measure = this.measures[m].uniqueName;
			try {
				var formattedMeasure = this.formatMeasure(measure, action);
				this.save(formattedMeasure, this.measures[m].caption, formatOver);
			} catch (err) {
				this.setUserFeedback(err);
			}
		}

		this.replaceMeasuresWithFormattedMeasures();
		self.workspace.sync_query();
		self.workspace.toolbar.run_query();
		//this.workspace.query.run();
		this.generatedMeasures = [];
		this.close();
	},

	formatMeasure: function (measure, action) {
		var measureExpression = "";
		if (action == "formatOverRows") {
			if (this.selectedColumns.length == 0) {
				throw "There are no dimensions in the columns to format over";
			}
			else {
				var dimensionsCrossJoined = this.makeCrossJoinExpression(this.selectedColumns);
				measureExpression = measure + " / SUM(CROSSJOIN(" + dimensionsCrossJoined + "," + measure + "))";
			}
		}
		else if (action == "formatOverColumns") {
			if (this.selectedRows.length == 0) {
				throw "There are no dimensions in the rows to format over";
			} else {
				var dimensionsCrossJoined = this.makeCrossJoinExpression(this.selectedRows);
				measureExpression = measure + " / SUM(CROSSJOIN(" + dimensionsCrossJoined + "," + measure + "))";
			}
		}
		else if (action == "formatOverTotal") {
			if (this.selectedRows.length == 0 && this.selectedColumns.length == 0) {
				throw "There are no dimensions in the rows and columns to format over";
			} else {
				var dimensionsCrossJoined = this.makeCrossJoinExpression(this.selectedRows.concat(this.selectedColumns));
				measureExpression = measure + " / SUM(CROSSJOIN(" + dimensionsCrossJoined + "," + measure + "))";
			}
		}

		return measureExpression;
	},

	replaceMeasuresWithFormattedMeasures: function () {
		var queryHelper = this.workspace.query.helper;
		queryHelper.clearMeasures();
		var calculatedMeasures = this.generatedMeasures;
		var calculatedMeasuresNamesAndTypes = [];
		for (var m = 0; m < calculatedMeasures.length; m++) {
			var calculatedMeasure = calculatedMeasures[m];
			calculatedMeasuresNamesAndTypes[m] = {name: calculatedMeasure.name, type: "CALCULATED"};
		}
		queryHelper.setMeasures(calculatedMeasuresNamesAndTypes);
	},

	extractFromMdx: function (mdx, what) {
		// A Saiku generated MDX query always generates the columns and rows as SET's prefixed with '~ROWS' or '~COLUMNS', let's find these
		var extraction = [];
		if (mdx == null || mdx == "") {
			extraction = [];
		}
		else {
			var searchArea = mdx.substring(0, mdx.indexOf("SELECT") - 1);

			var amountOfTimesToBeFound = this.occurrences(searchArea, what, false);
			var previousStart = 0;
			for (var i = 0; i < amountOfTimesToBeFound; i++) {
				var start = searchArea.indexOf(what, previousStart);
				var end = searchArea.indexOf("]", start);
				var dimensionSetName = searchArea.substring(start, end);
				extraction[i] = '[' + dimensionSetName + ']';
				previousStart = start + 1;
			}
		}
		return extraction;
	},

	/** Function count the occurrences of substring in a string;
	 * @param {String} string   Required. The string;
	 * @param {String} subString    Required. The string to search for;
	 * @param {Boolean} allowOverlapping    Optional. Default: false;
	 */
	occurrences: function (string, subString, allowOverlapping) {

		string += "";
		subString += "";
		if (subString.length <= 0) return string.length + 1;

		var n = 0, pos = 0;
		var step = (allowOverlapping) ? (1) : (subString.length);

		while (true) {
			pos = string.indexOf(subString, pos);
			if (pos >= 0) {
				n++;
				pos += step;
			} else break;
		}
		return (n);
	},

	makeCrossJoinExpression: function (dimensions) {
		var crossJoinExpression = dimensions[0];

		for (var i = 1; i < dimensions.length; i++) {
			crossJoinExpression += ' * ';
			crossJoinExpression += dimensions[i];
		}

		return crossJoinExpression;
	},

	determineFormatOver: function (action) {
		var formatOver = "";
		if (action.indexOf("Rows") != -1) {
			formatOver = "rows";
		} else if (action.indexOf("Columns") != -1) {
			formatOver = "columns";
		} else {
			formatOver = "total";
		}

		return formatOver;
	},

	setUserFeedback: function (msg) {
		$("#userFeedback").html("<p class='editor_info'>" + msg + "</p>");
	},

	checkRowsOrColumnsPresent: function (rows, cols) {
		if ((rows == null || rows == undefined || rows.length == 0) && (cols == null || cols == undefined || cols.length == 0)) {
			return "You selected no columns or rows, you should probably return.";
		} else return "";
	},
	help: function(){
		window.location("http://wiki.meteorite.bi/display/SAIK/Totals+and+Subtotals");
	}


});
/*
 *   Copyright 2015 OSBI Ltd
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
 * Class for get a parent member
 *
 * @class ParentMemberSelectorModal
 */
var ParentMemberSelectorModal = Modal.extend({

    selected_member:null,
    close_callback: null,
    select_type: 'parent-member-selector',
    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
	type: 'parent-member-selector',

    /**
     * Property with main template of modal
     *
     * @property template_modal
     * @type {String}
     * @private
     */
	template_modal:  _.template(
            '<form class="form-group" onsubmit="return false;">' +
            '<div class="group-elements" style="padding-top: 0;">' +
            '<nav class="breadcrumbs">' +
            '</nav>' +
            '<span class="loading i18n">Loading...</span>' +
            '</div>' +
            '<% if (Settings.PARENT_MEMBER_DIMENSION||this.select_type!=="parent-member-selector") { %>' +
            '<div class="group-elements">' +
            '<label for="dimension" class="i18n">Dimension:</label>' +
            '<select id="dimension" class="form-control">' +
            '<optgroup label="Measures">' +
            '<option value="[Measures].[Measures]" data-dimension="Measures" data-type="calcmember">Measures</option>' +
            '</optgroup>'+
            '<% _(dimensions).each(function(dimension) { %>' +
            '<optgroup label="<%= dimension.name %>">' +
            '<% _(dimension.hierarchies).each(function(hierarchy) { %>' +
            '<option value="<%= hierarchy.uniqueName %>" data-dimension="<%= dimension.name %>" data-type="calcmember"><%= hierarchy.name %></option>' +
            '<% }); %>' +
            '</optgroup>' +
            '<% }); %>' +
            '</select>' +
            '</div>' +
            '<% } %>' +
            '<div class="group-elements">' +
            '<label><span class="i18n">Selected Level:</span> <span class="selected-level"></span></label>' +
            '</div>' +
            '<div class="group-elements">' +
            '<ul class="members-list">' +
            '<li class="i18n">Loading...</li>' +
            '<ul>' +
            '</div>' +
            '<div class="group-elements">' +
            '<input type="search" class="form-control" id="auto-filter" results="5" placeholder="Autocomplete Filter">' +
            '</div>' +
            '</form>'
        ),

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Add',    method: 'save' },
        { text: 'Clear',  method: 'clear' },
        { text: 'Cancel', method: 'close' }
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click    .dialog_footer a' : 'call',
        'click    .crumb'           : 'fetch_crumb',
        'change   #dimension'       : 'fetch_dimension',
        'click    .drill_member'    : 'drill_member',
        'keyup    #auto-filter'     : 'auto_filter',
        'click    .member'          : 'select_member'
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.workspace = args.workspace;
        this.options.title = 'Member Selector';
        if(args.select_type!==undefined) {
            this.select_type = args.select_type;
        }
        this.current_level = args.current_level;
        this.lastLevel = args.lastLevel;
        this.selected_member = args.selected_member;
        this.close_callback = args.close_callback;
        // this.breadcrumbs = [];

        var dimensions = Saiku.session.sessionworkspace.cube[this.cube].get('data').dimensions;


        // Load template
        this.message = this.template_modal({
            dimensions: dimensions
        });

        this.bind('open', function() {
            this.$el.find('#dimension').val(this.selectDimension);

            if (_.isEmpty(this.uniqueName) && _.isEmpty(this.breadcrumbs) && !_.isEmpty(this.dimension)) {
                Saiku.ui.block('<span class="i18n">Loading...</span>');

                this.new_parent_member();
            }
            else if(!_.isEmpty(this.dimension)){
                Saiku.ui.block('<span class="i18n">Loading...</span>');

                this.edit_parent_member();
            }
        });
    },

    /**
     * If is in new mode, then fetches levels
     *
     * @method new_parent_member
     * @private
     */
    new_parent_member: function() {
        if(this.dimension != "Measures") {
            var level = new Level({}, {
                ui: this,
                cube: this.cube,
                dimension: this.dimension,
                hierarchy: this.hierarchy
            });

            level.fetch({
                success: this.get_levels
            });
        }
        else{
           var m = Saiku.session.sessionworkspace.cube[this.cube].get('data').measures;

            this.populate_members_list(m);
        }
    },

    /**
     * If is in edit mode, then fetches child members
     *
     * @method edit_parent_member
     * @private
     */
    edit_parent_member: function() {
        if(this.lastLevel!=undefined && this.lastLevel!="") {
            var level = new LevelMember({}, {
                ui: this,
                cube: this.cube,
                dimension: this.dimension,
                hierarchy: this.hierarchy,
                level: this.lastLevel
            });
            var that = this;
            level.fetch({
                success: function (data, otherdata) {
                    that.get_members(data, otherdata);
                    that.populate_breadcrumbs(that.breadcrumbs);
                }
            });
        }
        else{
            this.new_parent_member();
        }
    },

    /**
     * Populate breadcrumbs
     *
     * @method populate_breadcrumbs
     * @private
     * @param  {Array} data Array with breadcrumbs names
     */
    populate_breadcrumbs: function(data) {
        var $crumbs = [];
        var len = data.length;

        for (var i = 0; i < len; i++) {
            if (i !== (data.length - 1)) {
                if (i === 0 || i === 1) {
                    $crumbs.push('<a href="#fetch_crumb" class="crumb" data-position="' + i + '" data-action="false">' + data[i] + '</a> &gt;');
                }
                else {
                    $crumbs.push('<a href="#fetch_crumb" class="crumb" data-position="' + i + '" data-action="true">' + data[i] + '</a> &gt;');
                }
            }
            else {
                $crumbs.push('<span class="last-crumb">' + data[i] + '</span>');
            }
        }

        Saiku.ui.unblock();

        this.$el.find('.loading').remove();
        this.$el.find('.breadcrumbs').empty();
        this.$el.find('.breadcrumbs').append($crumbs);
    },

    /**
     * Populate members list
     *
     * @method populate_members_list
     * @private
     * @param  {Array} data Array with members list
     */
    populate_members_list: function(data) {
        var $members = [];
        var len = data.length;
        var self = this;
        this.$el.find('.members-list').empty();

        for (var i = 0; i < len; i++) {
            var levelunique ="";
            var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: data[i].uniqueName,
                levelUniqueName : data[i].levelunique, mname: data[i].name, mcaption: data[i].caption});
            $members = $('<li />')
                .addClass('member')
                .data('caption', data[i].caption)
                .data('uniqueName', data[i].uniqueName)
                .data('levelUniqueName', data[i].levelUniqueName ? data[i].levelUniqueName : false)
                .data('currentLevelUnique', data[i].levelUniqueName)
                .html(data[i].name+"<span class='drill_member' style='float:right;'>Next Level</span>");

            self.$el.find('.members-list').append($members);


        }

        Saiku.ui.unblock();
    },

    /**
     * Method that fetches the levels
     *
     * @method get_levels
     * @private
     * @param  {Object} model    Returned data from the model
     * @param  {Array} response  Returned data from the server
     */
    get_levels: function(model, response) {
        var levelMember;

        if (response) {
            model.ui.breadcrumbs = [model.ui.dimension, model.ui.hierarchy, response[0].name];
            model.ui.get_last_level();
            model.ui.populate_breadcrumbs(model.ui.breadcrumbs);
            model.ui.$el.find('.dialog_footer').find('a[href="#clear"]').data('name', response[0].name);
            levelMember = new LevelMember({}, { 
                ui: model.ui, 
                cube: model.ui.cube, 
                dimension: model.ui.dimension, 
                hierarchy: model.ui.hierarchy, 
                level: response[0].name 
            });
            levelMember.fetch({
                success: model.ui.get_members
            });
        }
        else {
            Saiku.ui.unblock();
        }
    },

    /**
     * Method that fetches the members
     *
     * @method get_members
     * @private
     * @param  {Object} model    Returned data from the model
     * @param  {Array} response  Returned data from the server
     */
    get_members: function(model, response) {
        if (response) {
            model.ui.populate_members_list(response);
        }
        else {
            Saiku.ui.unblock();
        }
    },

    /**
     * Method that fetches the child members
     *
     * @method get_child_members
     * @private
     * @param  {Object} model    Returned data from the model
     * @param  {Array} response  Returned data from the server
     */
    get_child_members: function(model, response) {
        var levelUniqueName;
        var position;

        if (response && response.length > 0) {
            model.ui.populate_members_list(response);

            levelUniqueName = response[0].levelUniqueName.split('].[');
            levelUniqueName = _.last(levelUniqueName).replace(/[\[\]]/gi, '');

            model.ui.breadcrumbs.push(levelUniqueName);
            model.ui.breadcrumbs = _.uniq(model.ui.breadcrumbs);
            //model.ui.uniqueName = model.uniqueName;

            position = _.indexOf(model.ui.breadcrumbs, levelUniqueName);

            model.ui.breadcrumbs = _.initial(model.ui.breadcrumbs, (model.ui.breadcrumbs.length - (position + 1)));

            //model.ui.uniqueName = model.uniqueName;
            //model.ui.selected_level();
            model.ui.get_last_level();

            model.ui.populate_breadcrumbs(model.ui.breadcrumbs);
        }
        else {
            Saiku.ui.unblock();
        }
    },

    return_actual_level: function(model, response) {

        if (response && response.length > 0) {
            model.ui.actualLevel = response[0].levelUniqueName;
        }
        else {
            Saiku.ui.unblock();
        }
    },

    /**
     * Drill in member
     *
     * @method drill_member
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    drill_member: function(event) {
        event.preventDefault();

        Saiku.ui.block('<span class="i18n">Loading...</span>');

        var $currentTarget = $(event.currentTarget);
        var uniqueName = $currentTarget.closest('.member').data('uniqueName');

        this.$el.find('#auto-filter').val('');

        var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: uniqueName });
        levelChildMember.fetch({
            success: this.get_child_members
        });        
    },

    /**
     * Drill in member
     *
     * @method drill_member
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    get_actual_level: function(event) {

        Saiku.ui.block('<span class="i18n">Loading...</span>');


        var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: event });
        levelChildMember.fetch({
            success: this.return_actual_level
        });
    },


    /**
     * Auto filter in member
     *
     * @method auto_filter
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     * @example
     *     [USA].[CA].[Los Angeles]
     */
    auto_filter: function(event) {
        if (event.keyCode === 13) {
            return false;
        }
        else {
            var $currentTarget = $(event.currentTarget);
            var uniqueName = $currentTarget.val();
            var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: uniqueName });
            if (uniqueName && !(_.isEmpty(uniqueName))) {
                levelChildMember.fetch({
                    success: this.get_child_members
                });
            }
        }
    },

    /**
     * Fetch crumbs
     *
     * @method fetch_crumb
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    fetch_crumb: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);

        if ($currentTarget.data('action')) {

            var levelMember = new LevelMember({}, { 
                ui: this, 
                cube: this.cube, 
                dimension: this.dimension, 
                hierarchy: this.hierarchy, 
                level: $currentTarget.text() 
            });
            levelMember.fetch({
                success: this.get_members
            });

            this.reset_form();
            this.breadcrumbs = _.initial(this.breadcrumbs, (this.breadcrumbs.length - (Number($currentTarget.data('position')) + 1)));
            // this.selected_level();
            this.populate_breadcrumbs(this.breadcrumbs);
        }
    },

    /**
     * Fetch dimension
     *
     * @method fetch_dimension
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    fetch_dimension: function(event) {
        event.preventDefault();

        Saiku.ui.block('<span class="i18n">Loading...</span>');

        var dimension = {
            val: this.$el.find('#dimension option:selected').val(),
            txt: this.$el.find('#dimension option:selected').text(),
            dataDimension: this.$el.find('#dimension option:selected').data('dimension')
        };

        this.reset_form();
        this.dimension = dimension.dataDimension;
        this.hierarchy = dimension.txt;
        this.new_parent_member();
    },

    /**
     * Add a selected level
     *
     * @method selected_level
     * @private
     */
    selected_level: function() {
        var selectedLevel;

        if ((this.breadcrumbs.length - 2) < 2) {
            selectedLevel = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.$el.find('.selected-level').text(selectedLevel);
        }
        else {
            selectedLevel = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.$el.find('.selected-level').text(selectedLevel);
        }
    },

    /**
     * Get the last level
     *
     * @method get_last_level
     * @private
     */
    get_last_level: function() {
        this.lastLevel = _.last(this.breadcrumbs);
    },

    /**
     * Reset form
     *
     * @method reset_form
     * @private
     */
    reset_form: function() {
        this.uniqueName = '';
        this.$el.find('.selected-level').text('');
        this.$el.find('.members-list').empty();
        this.$el.find('.members-list').append('<li class="i18n">Loading...</li>');
        this.$el.find('#auto-filter').val('');
    },

    /**
     * Clear dialog
     *
     * @method clear
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    clear: function(event) {
        event.preventDefault();

        var name = $(this.el).find('.dialog_footer').find('a[href="#clear"]').data('name');
        var levelMember = new LevelMember({}, { 
            ui: this, 
            cube: this.cube, 
            dimension: this.dimension, 
            hierarchy: this.hierarchy, 
            level: name 
        });
        levelMember.fetch({
            success: this.get_members
        });

        this.reset_form();

        var position = _.indexOf(this.breadcrumbs, name);

        this.breadcrumbs = _.initial(this.breadcrumbs, (this.breadcrumbs.length - (position + 1)));
        this.populate_breadcrumbs(this.breadcrumbs);
    },

    /**
     * Add uniqueName and breadcrumbs in dialog Calculated Member
     *
     * @method save
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    save: function(event) {
        event.preventDefault();

        var alertMsg = '';

        if (typeof this.uniqueName === 'undefined' || _.isEmpty(this.uniqueName)) {
            alertMsg += 'You have to choose a member for the calculated member!';
        }
        if (alertMsg !== '') {
            alert(alertMsg);
        }
        else {
            if(this.select_type === "parent-member-selector") {

                var dimHier = '[' + this.dimension + '].[' + this.hierarchy + '].';
                var uniqueName = this.uniqueName.split(dimHier)[1] !== undefined ?
                    this.uniqueName.split(dimHier)[1] :
                    this.uniqueName.split(dimHier)[0];

                // console.log(uniqueName);
                // console.log(this.breadcrumbs);
                this.dialog.actualLevel = this.actualLevel;
                if (Settings.PARENT_MEMBER_DIMENSION) {
                    // Trigger event when assign key
                    Saiku.session.trigger('ParentMemberSelectorModal:save', {
                        dialog: this.dialog,
                        selectedDimension: this.$el.find('#dimension option:selected').val()
                    });
                }

                this.dialog.pmUniqueName = dimHier + uniqueName;
                this.dialog.pmLevel = this.current_level;
                this.dialog.lastLevel = this.lastLevel;
                this.dialog.pmBreadcrumbs = _.uniq(this.breadcrumbs);
                this.dialog.$el.find('#cms-pmember').val(dimHier + uniqueName);
                this.$el.dialog('close');
            }
            else{
                if(this.dimension !== "Measures") {

                    var dimHier = '[' + this.dimension + '].[' + this.hierarchy + '].';
                    var uniqueName = this.uniqueName.split(dimHier)[1] !== undefined ?
                        this.uniqueName.split(dimHier)[1] :
                        this.uniqueName.split(dimHier)[0];
                    if (this.close_callback != null) {
                        this.close_callback(dimHier + uniqueName)
                    }
                }
                else{
                    this.close_callback(this.uniqueName);

                }
                this.$el.dialog('close');
            }
        }
    },

    /**
     * Triggered when a user selects a member from the list.
     *
     * @method select_member
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    select_member: function(event){
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);
        $currentTarget.closest('ul').children('li').removeClass('highlight_li');
        $currentTarget.addClass('highlight_li');
        this.uniqueName = $currentTarget.data('uniqueName');
        this.get_actual_level(this.uniqueName);
        //model.ui.uniqueName = model.uniqueName;
        this.current_level = $currentTarget.data('currentLevelUnique');
        this.selected_level();
        this.$el.find('#auto-filter').val('');


    }
});
/*
 *   Copyright 2015 OSBI Ltd
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
 * Modal with Data Sources
 *
 * @class DataSourcesModal
 * @example
 *     var formElements = {
 *         'url'      : '#jdbcurl',
 *         'driver'   : '#driver',
 *         'username' : '#connusername',
 *         'password' : '#connpassword'
 *     };
 *     (new DataSourcesModal({ dialog: this, formElements: formElements })).render().open();
 */
var DataSourcesModal = Modal.extend({
    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
    type: 'data-sources',

    /**
     * Property with main template of modal
     *
     * @property message
     * @type {String}
     * @private
     */
    message: '<form class="form-group-inline">' +
                '<label for="data-sources">Select a data source:</label>' +
                '<select class="form-control" id="data-sources"></select>' +
             '</form>',

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Add', method: 'add' },
        { text: 'Cancel', method: 'close' }
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click .dialog_footer a' : 'call'
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.options.title = 'Data Sources';
        var dataSources = new DataSources({}, { dialog: this });
        dataSources.fetch();
        this.bind('open');
    },

    /**
     * Template for create element <option>
     *
     * @method option_template
     * @private
     * @param  {Object} parameters Name parameter
     * @return {String}            HTML template
     */
    option_template: function(data) {
        return _.template(
            '<option value="">-- Select --</option>' +
            '<% _.each(obj, function(value) { %>' +
                '<option value="<%= value.name %>"><%= value.name %></option>' +
            '<% }); %>'
        )(data);
    },

    /**
     * Callback to put values in element <option>
     * @private
     * @param  {Object} data Values of data sources
     */
    callback: function(data) {
        var $dataSources = this.option_template(data);
        this.dataSources = data;
        this.$el.find('#data-sources').append($dataSources);
    },

    /**
     * Method to populate parent form
     * @private
     * @param  {String} selectedDataSource Data source selected
     */
    populate_form: function(selectedDataSource) {
        var dataSources = this.dataSources;
        var len = dataSources.length;
        var i;

        for (i = 0; i < len; i++) {
            if (dataSources[i].name === selectedDataSource) {
                // Set URL
                this.dialog.$el.find(this.formElements.url).val(dataSources[i].url);
                // Set Driver
                this.dialog.$el.find(this.formElements.driver).val(dataSources[i].driver);
                // Set Username
                this.dialog.$el.find(this.formElements.username).val(dataSources[i].username);
                // Set Password
                this.dialog.$el.find(this.formElements.password).val(dataSources[i].password);
            }
        }
    },

    /**
     * Add data source in parent form
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    add: function(event) {
        event.preventDefault();
        var selectedDataSource = this.$el.find('#data-sources option:selected').val();
        if (selectedDataSource) {
            this.populate_form(selectedDataSource);
        }
        this.$el.dialog('close');
    }
});/*
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
 * The query toolbar, and associated actions
 */
var QueryToolbar = Backbone.View.extend({



    events: {
        'click .options a.button': 'call',
        'click .renderer a.button' : 'switch_render_button'
    },

    chart: {},

    render_mode: "table",
    spark_mode: null,


    initialize: function(args) {
        // Keep track of parent workspace
        this.workspace = args.workspace;

        // Maintain `this` in callbacks
        _.bindAll(this, "call","activate_buttons", "spark_bar", "spark_line", "render_row_viz", "run_row_viz", "switch_render_button");

        this.render_mode = "table";
        this.spark_mode = null;

        // Activate buttons when a new query is created or run
        this.workspace.bind('query:new', this.activate_buttons);
        this.workspace.bind('query:result', this.activate_buttons);
        this.workspace.bind('table:rendered', this.run_row_viz);

    },

    activate_buttons: function(args) {
        if (typeof args != "undefined" && args !== null ) {
            $(this.el).find('a').removeClass('disabled_toolbar');
            if (!args.data) {
                $(this.el).find('a.export_button, a.stats').addClass('disabled_toolbar');
            }
            if (isIE /*|| Settings.BIPLUGIN5*/) {
                $(this.el).find('a.export_button').addClass('disabled_toolbar');
            }
        }

    },

    template: function() {
        var template = $("#template-query-toolbar").html() || "";
        return _.template(template)();
    },

    render: function() {
        $(this.el).html(this.template());

        $(this.el).find('render_table').addClass('on');
        $(this.el).find('ul.table').show();
        return this;
    },

    switch_render_button: function(event) {
        var $target = $(event.target);
        event.preventDefault();
        if ($(event.target).hasClass('disabled_toolbar')) {
            return false;
        }
        $target.parent().siblings().find('.on').removeClass('on');
        
        var isMap = $(this.el).find('ul.chart li a.on:first').size() > 0 ?
                        $(this.el).find('ul.chart li a.on:first').attr('href').replace('#', '')
                        : null;
        
        if ($target.hasClass('render_chart')) {
            Saiku.events.trigger("queryToolbar:render_chart", this, null);
            if (isMap === 'map') {
                var mapProperties = this.workspace.query.getProperty('saiku.ui.map.options');
                var mapType = mapProperties ? mapProperties.mapDefinition.type : '';
                this.switch_render('map');
                this.workspace.query.setProperty('saiku.ui.render.mode', 'map');
                this.workspace.query.setProperty('saiku.ui.render.type', mapType);
            }
            else {
                this.switch_render('chart');
                this.workspace.query.setProperty('saiku.ui.render.mode', 'chart');
                var c = $(this.el).find('ul.chart li a.on:first').size() > 0 ?
                            $(this.el).find('ul.chart li a.on:first').attr('href').replace('#', '')
                            : null;
                if (c !== null) {
                    if (c !== 'charteditor') {
                        this.workspace.query.setProperty('saiku.ui.render.type', c);
                    }
                    else {
                        c = $(this.el).find('ul.chart li').not('.chart_editor').find('a.on').attr('href').replace('#', '');
                        this.workspace.query.setProperty('saiku.ui.render.type', c);
                    }
                }
            }
        } else {
            this.switch_render('table');
            this.workspace.query.setProperty('saiku.ui.render.mode', 'table');
            this.workspace.query.setProperty('saiku.ui.render.type', this.spark_mode);
        }
    },
    switch_render: function(render_type) {
        render_type = (typeof render_type != "undefined" ? render_type.toLowerCase() : "table");
        $(this.el).find('ul.renderer a.on').removeClass('on');
        $(this.el).find('ul.renderer a.render_' + render_type).addClass('on');
        if ("chart" == render_type) {
            $(this.el).find('ul.chart').show();
            $(this.el).find('ul.table').hide();
            this.render_mode = "chart";
            $(this.workspace.el).find('.workspace_results').children().hide();
            $(this.workspace.chart.el).find('.canvas_wrapper').hide();
            this.workspace.chart.show();
            this.workspace.set_class_charteditor();
        } 
        else if (render_type === 'map') {
            this.$el.find('ul.renderer a.render_chart').addClass('on');
            this.$el.find('ul.chart').show();
            this.$el.find('ul.table').hide();
            this.render_mode = 'map';
            this.workspace.$el.find('.workspace_results').children().hide();
            this.workspace.chart.$el.find('.canvas_wrapper').hide();
            this.workspace.chart.show();
        }
        else {
            $(this.el).find('ul.chart').hide();
            $(this.el).find('ul.table').show();
            $(this.el).find('ul.table .stats').removeClass('on');
            $(this.workspace.el).find('.workspace_results').children().hide();
            $(this.workspace.el).find('.workspace_results .table_wrapper').show();
            $(this.workspace.chart.el).hide().children().hide();
            this.render_mode = "table";
            var hasRun = this.workspace.query.result.hasRun();
            if (hasRun) {
                this.workspace.table.render({ data: this.workspace.query.result.lastresult() });
            }

        }
        return false;
    },

    call: function(event) {
        var $target = $(event.target).hasClass('button') ? $(event.target) : $(event.target).parent();
        if (!$target.hasClass('disabled_toolbar')) {
            // Determine callback
            var callback = $target.attr('href').replace('#', '');
            
            // Attempt to call callback
            if (this.render_mode == "table" && this[callback]) {
                this[callback](event);
            } 
            else if (this.render_mode == "chart") {
                this.workspace.chart.$el.find('.canvas_wrapper').find('.map-render').data('action', 'querytoolbar');
                if ($target.hasClass('chartoption')) {
                    var mapProperties = {};
                    mapProperties.mapDefinition = {};
                    this.workspace.query.setProperty('saiku.ui.map.options', mapProperties);
                    this.workspace.query.setProperty('saiku.ui.render.mode', 'chart');
                    this.workspace.querytoolbar.$el.find('ul.chart [href="#export_button"]').parent().removeAttr('disabled');
                    this.workspace.querytoolbar.$el.find('ul.chart > li#charteditor').removeAttr('disabled');
                    this.workspace.querytoolbar.$el.find('ul.chart [href="#map"]').removeClass('on');
                    $target.parent().siblings().find('.chartoption.on').removeClass('on');
                    $target.addClass('on');
                    this.workspace.set_class_charteditor();
                }
                if (callback == "export_button") {
                    this.workspace.chart[callback](event);
                } else {
                    this.workspace.chart.renderer.switch_chart(callback);
                    this.workspace.query.setProperty('saiku.ui.render.type', callback);
                }
            }
            else if (this.render_mode === 'map' && callback !== 'map') {
                this.workspace.chart.$el.find('.canvas_wrapper').find('.map-render').data('action', 'querytoolbar');
                if ($target.hasClass('chartoption')) {
                    var mapProperties = {};
                    mapProperties.mapDefinition = {};
                    this.workspace.query.setProperty('saiku.ui.map.options', mapProperties);
                    this.workspace.query.setProperty('saiku.ui.render.mode', 'chart');
                    this.workspace.querytoolbar.$el.find('ul.chart [href="#export_button"]').parent().removeAttr('disabled');
                    this.workspace.querytoolbar.$el.find('ul.chart > li#charteditor').removeAttr('disabled');
                    this.workspace.querytoolbar.$el.find('ul.chart [href="#map"]').removeClass('on');
                    $target.parent().siblings().find('.chartoption.on').removeClass('on');
                    $target.addClass('on');
                }
                if (callback == "export_button") {
                    this.workspace.chart[callback](event);
                } else {
                    this.workspace.chart.renderer.switch_chart(callback);
                    this.workspace.query.setProperty('saiku.ui.render.type', callback);
                }
            }
        }
        event.preventDefault();
        return false;
    },

    spark_bar: function() {
        $(this.el).find('ul.table .spark_bar').toggleClass('on');
        $(this.el).find('ul.table .spark_line').removeClass('on');

        $(this.workspace.table.el).find('td.spark').remove();
        if ($(this.el).find('ul.table .spark_bar').hasClass('on')) {
            this.spark_mode = "spark_bar";
            this.workspace.query.setProperty('saiku.ui.render.type', 'spark_bar');
            _.delay(this.render_row_viz, 10, "spark_bar");
        } else {
            this.spark_mode = null;
        }
    },

    spark_line: function() {
        $(this.el).find('ul.table .spark_line').toggleClass('on');
        $(this.el).find('ul.table .spark_bar').removeClass('on');

        $(this.workspace.table.el).find('td.spark').remove();
        if ($(this.el).find('ul.table .spark_line').hasClass('on')) {
            this.spark_mode = "spark_line";
            this.workspace.query.setProperty('saiku.ui.render.type', 'spark_line');
            _.delay(this.render_row_viz, 10, "spark_line");
        } else {
            this.spark_mode = null;
        }
    },

    run_row_viz: function(args) {
        if (this.render_mode == "table" && this.spark_mode !== null) {
            this.render_row_viz(this.spark_mode);
        }

    },

    render_row_viz: function(type) {
        $(this.workspace.table.el).find('tr').each(function(index, element) {
            var rowData = [];
            $(element).find('td.data div').each(function(i,data) {
                var val = $(data).attr('alt');
                val = (typeof val != "undefined" && val !== "" && val !== null && val  != "undefined") ? parseFloat(val) : 0;
                rowData.push(val);
            });

            $("<td class='data spark'>&nbsp;<div id='chart" + index + "'></div></td>").appendTo($(element));

            var width = rowData.length * 9;

                if (rowData.length > 0) {
                    var vis = new pv.Panel()
                        .canvas('chart' + index)
                        .height(12)
                        .width(width)
                        .margin(0);

                    if (type == "spark_bar") {
                        vis.add(pv.Bar)
                            .data(rowData)
                            .left(pv.Scale.linear(0, rowData.length).range(0, width).by(pv.index))
                            .height(pv.Scale.linear(0,_.max(rowData)).range(0, 12))
                            .width(6)
                            .bottom(0);
                    } else if (type == "spark_line") {
                        width = width / 2;
                        vis.width(width);
                        vis.add(pv.Line)
                            .data(rowData)
                            .left(pv.Scale.linear(0, rowData.length - 1).range(0, width).by(pv.index))
                            .bottom(pv.Scale.linear(rowData).range(0, 12))
                            .strokeStyle("#000")
                            .lineWidth(1);
                    }
                    vis.render();
                }
        });
    }
});
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
 * The workspace toolbar, and associated actions
 */
var WorkspaceToolbar = Backbone.View.extend({
    enabled: false,
    events: {
        'click a': 'call'
    },

    initialize: function(args) {
        // Keep track of parent workspace
        this.workspace = args.workspace;

        // Maintain `this` in callbacks
        _.bindAll(this, "call", "reflect_properties", "run_query",
            "swap_axes_on_dropzones", "display_drillthrough","clicked_cell_drillthrough_export",
			"clicked_cell_drillacross","clicked_cell_drillthrough","activate_buttons", "switch_to_mdx","post_mdx_transform", "toggle_fields_action", "group_parents");
        this.workspace.bind('workspace:toolbar:render', this.translate);

        // Redraw the toolbar to reflect properties
        this.workspace.bind('properties:loaded', this.reflect_properties);

        // Fire off workspace event
        this.workspace.trigger('workspace:toolbar:render', {
            workspace: this.workspace
        });

        // Activate buttons when a new query is created or run
        this.workspace.bind('query:new', this.activate_buttons);
        this.workspace.bind('query:result', this.activate_buttons);

    },

    activate_buttons: function(args) {
        if (args !== null && args.data && args.data.cellset && args.data.cellset.length > 0 ) {
            $(args.workspace.toolbar.el).find('.button')
                .removeClass('disabled_toolbar');

            $(args.workspace.el).find("td.data").removeClass('cellhighlight').unbind('click');
            $(args.workspace.el).find(".table_mode").removeClass('on');

        } else {
            $(args.workspace.toolbar.el).find('.button')
                .addClass('disabled_toolbar').removeClass('on');
            $(args.workspace.el).find('.fields_list .disabled_toolbar').removeClass('disabled_toolbar');
            $(args.workspace.toolbar.el)
                .find('.about, .new, .open, .save, .edit, .run,.auto,.non_empty,.toggle_fields,.toggle_sidebar,.switch_to_mdx, .mdx')
                .removeClass('disabled_toolbar');
        }

        this.reflect_properties();

    },

    template: function() {
        var template = $("#template-workspace-toolbar").html() || "";
        return _.template(template)();
    },

    render: function() {
        $(this.el).html(this.template());

        return this;
    },

    translate: function() {
        //Saiku.i18n.translate();
    },
    call: function(event) {
        // Determine callback
        event.preventDefault();
        var callback = event.target.hash.replace('#', '');

        // Attempt to call callback
        if (! $(event.target).hasClass('disabled_toolbar') && this[callback]) {
            this[callback](event);
        }

        return false;
    },

    reflect_properties: function() {
        var properties = this.workspace.query.model.properties ?
            this.workspace.query.model.properties : Settings.QUERY_PROPERTIES;

        // Set properties appropriately
        if (properties['saiku.olap.query.nonempty'] === true) {
            $(this.el).find('.non_empty').addClass('on');
        }
        if (properties['saiku.olap.query.automatic_execution'] === true) {
            $(this.el).find('.auto').addClass('on');
        }

        if (properties['saiku.olap.query.drillthrough'] !== true) {
            $(this.el).find('.drillthrough, .drillthrough_export').addClass('disabled_toolbar');
        }

        if (properties['org.saiku.query.explain'] !== true) {
            $(this.el).find('.explain_query').addClass('disabled_toolbar');
        }

        if (properties['org.saiku.connection.scenario'] !== true) {
            $(this.el).find('.query_scenario').addClass('disabled_toolbar');
        } else {
            $(this.el).find('.query_scenario').removeClass('disabled_toolbar');
            $(this.el).find('.drillthrough, .drillthrough_export').addClass('disabled_toolbar');
        }
        if (properties['saiku.olap.query.limit'] == 'true' || properties['saiku.olap.query.filter'] === true) {
            $(this.workspace.el).find('.fields_list_header').addClass('limit');
        }

        if (this.workspace.query.getProperty('saiku.olap.result.formatter') !== "undefined" && this.workspace.query.getProperty('saiku.olap.result.formatter') == "flattened") {
            if (! $(this.el).find('.group_parents').hasClass('on')) {
                $(this.el).find('.group_parents').addClass('on');
            }
        }
        if ($(this.workspace.el).find( ".workspace_results tbody.ui-selectable" ).length > 0) {
            $(this.el).find('.zoom_mode').addClass('on');
        }

        $(this.el).find(".spark_bar, .spark_line").removeClass('on');
        $(this.el).find('a.edit').removeClass('disabled_toolbar');

        if (Settings.MODE == 'VIEW' || this.workspace.isReadOnly) {
            $(this.el).find('a.edit').hide();
            $(this.el).find('a.save').hide();
        } else {
            if (this.workspace.viewState == 'view') {
                $(this.el).find('a.edit').removeClass('on');
            } else {
                $(this.el).find('a.edit').addClass('on');
            }
            $(this.el).find('a.edit').show('normal');
        }
    },

    new_query: function(event) {
        if(typeof ga!= 'undefined'){
		ga('send', 'event', 'Toolbar', 'New Query');
        }
        this.workspace.switch_view_state('edit');
        this.workspace.new_query();

        return false;
    },

    edit_query: function(event) {
        $(event.target).toggleClass('on');

        if ($(event.target).hasClass('on')) {
            this.workspace.switch_view_state('edit');
        } else {
            this.workspace.switch_view_state('view');
        }
    },

    save_query: function(event) {
        var self = this;
        if (this.workspace.query) {
            if (typeof this.editor != "undefined") {
                var mdx = this.editor.getValue();
                this.workspace.query.model.mdx = mdx;
            }
            (new SaveQuery({ query: this.workspace.query })).render().open();
        }
    },

    open_query: function(event) {
            (new OpenDialog()).render().open();
    },


    run_query: function(event) {
        this.workspace.query.run(true);
    },

    automatic_execution: function(event) {
        // Change property
        var newState = !this.workspace.query.getProperty('saiku.olap.query.automatic_execution');
        this.workspace.query.setProperty('saiku.olap.query.automatic_execution', newState);

        if (newState) {
            $(event.target).addClass('on');
        } else {
            $(event.target).removeClass('on');
        }
    },

    toggle_fields: function(event) {
        var self = this;
        if (event) {
            $(this.el).find('.toggle_fields').toggleClass('on');
        }
        if (!$(this.el).find('.toggle_fields').hasClass('on')) {
            this.toggle_fields_action('hide');
        } else {
            this.toggle_fields_action('show');
        }

    },

    toggle_fields_action: function(action, dontAnimate) {
        var self = this;
        if ( action == 'show' && $('.workspace_editor').is(':visible')) {
            return;
        } else if ( action == 'hide' && $('.workspace_editor').is(':hidden')) {
            return;
        }
        if (dontAnimate) {
            $('.workspace_editor').css('height','');
            if ($('.workspace_editor').is(':hidden')) {
                $('.workspace_editor').show();
            } else {
                $('.workspace_editor').hide();
            }
            return;
        }

        if (action == 'hide') {
            $(this.workspace.el).find('.workspace_editor').hide();
        } else {
            $(this.workspace.el).find('.workspace_editor').show();
        }

        // avoid scrollbar on the right

        /*
        var wf = $('.workspace_editor').height();
        if ( action == 'hide') {
            var wr = $('.workspace_results').height();
            $('.workspace_results').height(wr - wf);
        }
        $(this.workspace.el).find('.workspace_editor').slideToggle({
            queue: false,
            progress: function() {
                self.workspace.adjust();
            },
            complete: function() {
                if ($('.workspace_editor').is(':hidden')) {
                    $('.workspace_editor').height(wf);
                } else {
                    $('.workspace_editor').css('height','');
                }

                self.workspace.adjust();
            }
        });

        */
    },

    about: function() {
        (new AboutModal()).render().open();
        return false;
    },

    toggle_sidebar: function() {
        this.workspace.toggle_sidebar();
    },

    // group_parents: function(event) {
    //     $(event.target).toggleClass('on');
    //     if ($(event.target).hasClass('on')) {
    //         this.workspace.query.setProperty('saiku.olap.result.formatter', 'flattened');
    //     } else {
    //         this.workspace.query.setProperty('saiku.olap.result.formatter', 'flat');
    //     }
    //     this.workspace.query.run();
    // },

    group_parents: function(event) {
        if (event) {
            $(event.target).toggleClass('on');
        }
        // this.$el.find('.group_parents').toggleClass('on')
        if (this.$el.find('.group_parents').hasClass('on')) {
            this.workspace.query.setProperty('saiku.olap.result.formatter', 'flattened');
        } else {
            this.workspace.query.setProperty('saiku.olap.result.formatter', 'flat');
        }
        this.workspace.query.run();
    },

    non_empty: function(event) {
        // Change property
        var nonEmpty = !this.workspace.query.getProperty('saiku.olap.query.nonempty');
        this.workspace.query.helper.nonEmpty(nonEmpty);

        this.workspace.query.setProperty('saiku.olap.query.nonempty', nonEmpty);

        // Toggle state of button
        $(event.target).toggleClass('on');

        // Run query
        this.workspace.query.run();
    },

    swap_axis: function(event) {
        // Swap axes
        $(this.workspace.el).find('.workspace_results table').html('');
        this.workspace.query.helper.swapAxes();
        this.workspace.sync_query();
        this.workspace.query.run(true);
    },


    check_modes: function(source) {
        if (typeof source === "undefined" || source === null)
            return;

        if ($(this.workspace.el).find( ".workspace_results tbody.ui-selectable" ).length > 0) {
            $(this.workspace.el).find( ".workspace_results tbody" ).selectable( "destroy" );
        }
        if (!$(source).hasClass('on')) {
            $(this.workspace.el).find("td.data").removeClass('cellhighlight').unbind('click');
            $(this.workspace.el).find(".table_mode").removeClass('on');

            this.workspace.query.run();
        } else {
            if ($(source).hasClass('drillthrough_export')) {
                $(this.workspace.el).find("td.data").addClass('cellhighlight').unbind('click').click(this.clicked_cell_drillthrough_export);
                $(this.workspace.el).find(".query_scenario, .drillthrough, .zoom_mode, .drillacross").removeClass('on');
            } else if ($(source).hasClass('drillthrough')) {
                $(this.workspace.el).find("td.data").addClass('cellhighlight').unbind('click').click(this.clicked_cell_drillthrough);
                $(this.workspace.el).find(".query_scenario, .drillthrough_export, .zoom_mode, .drillacross").removeClass('on');
            } else if ($(source).hasClass('query_scenario')) {
                this.workspace.query.scenario.activate();
                $(this.workspace.el).find(".drillthrough, .drillthrough_export, .zoom_mode, .drillacross").removeClass('on');
            } else if ($(source).hasClass('drillacross')) {
				$(this.workspace.el).find("td.data").addClass('cellhighlight').unbind('click').click(this.clicked_cell_drillacross);
				$(this.workspace.el).find(".query_scenario, .drillthrough, .drillthrough_export, .zoom_mode").removeClass('on');
			} else if ($(source).hasClass('zoom_mode')) {

                var self = this;
                $(self.workspace.el).find( ".workspace_results tbody" ).selectable({ filter: "td", stop: function( event, ui ) {
                    var positions = [];
                    $(self.workspace.el).find( ".workspace_results" ).find('td.ui-selected div').each(function(index, element) {
                        var p = $(element).attr('rel');
                        if (p) {
                            positions.push(p);
                        }
                    });
                    $(self.workspace.el).find( ".workspace_results" ).find('.ui-selected').removeClass('.ui-selected');

                    positions = _.uniq(positions);
                    if (positions.length > 0) {
						self.workspace.query.action.put("/zoomin", { success: function(model, response) {
							self.workspace.query.parse(response);
							self.workspace.unblock();
							self.workspace.sync_query();
							Saiku.ui.unblock();
							self.workspace.query.run();
						},
							data: { selections : JSON.stringify(positions) }
						});
                    }
                } });
                $(this.workspace.el).find(".drillthrough, .drillthrough_export, .query_scenario, .drillacross, .about").removeClass('on');
            }
        }


    },
    query_scenario: function(event) {
       $(event.target).toggleClass('on');
        this.check_modes($(event.target));

    },
    zoom_mode: function(event) {
       $(event.target).toggleClass('on');
        this.check_modes($(event.target));

    },
	drillacross: function(event) {
		 $(event.target).toggleClass('on');
		 this.check_modes($(event.target));
		 },
    drillthrough: function(event) {
       $(event.target).toggleClass('on');
        this.check_modes($(event.target));
    },

    display_drillthrough: function(model, response) {
        this.workspace.table.render({ data: response });
        Saiku.ui.unblock();
    },

    export_drillthrough: function(event) {
        $(event.target).toggleClass('on');
        this.check_modes($(event.target));
    },

	clicked_cell_drillacross: function(event) {
		 $target = $(event.target).hasClass('data') ?
			 $(event.target).find('div') : $(event.target);
		 var pos = $target.attr('rel');
		 (new DrillAcrossModal({
		 workspace: this.workspace,
			 title: "Drill Across",
			 action: "export",
			 position: pos,
			 query: this.workspace.query
		 })).open();

	 },
    clicked_cell_drillthrough_export: function(event) {
        $target = $(event.target).hasClass('data') ?
            $(event.target).find('div') : $(event.target);
        var pos = $target.attr('rel');
        (new DrillthroughModal({
            workspace: this.workspace,
            maxrows: 10000,
            title: "Drill-Through to CSV",
            action: "export",
            position: pos,
            query: this.workspace.query
        })).open();

    },

    clicked_cell_drillthrough: function(event) {
        $target = $(event.target).hasClass('data') ?
            $(event.target).find('div') : $(event.target);
        var pos = $target.attr('rel');
        (new DrillthroughModal({
            workspace: this.workspace,
            maxrows: 200,
            title: "Drill-Through",
            action: "table",
            success: this.display_drillthrough,
            position: pos,
            query: this.workspace.query
        })).open();

    },

    swap_axes_on_dropzones: function(model, response) {
		this.workspace.query.parse(response);
		this.workspace.unblock();
		this.workspace.sync_query();
		Saiku.ui.unblock();
        /*
        $columns = $(this.workspace.drop_zones.el).find('.columns')
            .children()
            .detach();
        $rows = $(this.workspace.drop_zones.el).find('.rows')
            .children()
            .detach();

        $(this.workspace.drop_zones.el).find('.columns').append($rows);
        $(this.workspace.drop_zones.el).find('.rows').append($columns);
        var rowLimit = $(this.workspace).find('fields_list.ROWS .limit').hasClass('on') | false;
        var colLimit = $(this.workspace).find('fields_list.COLUMNS .limit').hasClass('on') | false;
        $(this.workspace).find('fields_list.ROWS .limit').removeClass('on');
        $(this.workspace).find('fields_list.COLUMNS .limit').removeClass('on');
        if (rowLimit) {
            $(this.workspace).find('fields_list.COLUMNS .limit').addClass('on');
        }
        if (colLimit) {
            $(this.workspace).find('fields_list.ROWS .limit').addClass('on');
        }
        */
        this.workspace.unblock();
        this.workspace.sync_query();
        Saiku.ui.unblock();
    },

    show_mdx: function(event) {
        //this.workspace.query.enrich();

        (new MDXModal({ mdx: this.workspace.query.model.mdx })).render().open();
    },

    workspace_titles: function(event) {
        //this.workspace.query.enrich();

        (new TitlesModal({ query: this.workspace.query })).render().open();
    },

    export_xls: function(event) {
		if(this.workspace.query.name!=undefined){
			var filename = this.workspace.query.name.substring(this.workspace.query.name.lastIndexOf('/')+1).slice(0, -5);
			window.location = Settings.REST_URL +
			this.workspace.query.url() + "/export/xls/" + this.workspace.query.getProperty('saiku.olap.result.formatter')+"?exportname=" + encodeURIComponent(filename)+"xls";
		}
		else{
			window.location = Settings.REST_URL +
			this.workspace.query.url() + "/export/xls/" + this.workspace.query.getProperty('saiku.olap.result.formatter');
		}


    },

    export_csv: function(event) {
		if(this.workspace.query.name!=undefined){
			var filename = this.workspace.query.name.substring(this.workspace.query.name.lastIndexOf('/')+1).slice(0, -6);
			window.location = Settings.REST_URL +
			this.workspace.query.url() + "/export/csv/" + this.workspace.query.getProperty('saiku.olap.result.formatter')+"?exportname=" + encodeURIComponent(filename);
		}
		else{
			window.location = Settings.REST_URL +
			this.workspace.query.url() + "/export/csv/" + this.workspace.query.getProperty('saiku.olap.result.formatter');
		}

    },


    export_pdf: function(event) {
		if(this.workspace.query.name!=undefined){
			var filename = this.workspace.query.name.substring(this.workspace.query.name.lastIndexOf('/')+1).slice(0, -6);
			window.location = Settings.REST_URL +
			this.workspace.query.url() + "/export/pdf/" + this.workspace.query.getProperty('saiku.olap.result.formatter')+"?exportname=" + encodeURIComponent(filename);
		}
		else{
			window.location = Settings.REST_URL +
			this.workspace.query.url() + "/export/pdf/" + this.workspace.query.getProperty('saiku.olap.result.formatter');
		}
    },

    switch_to_mdx: function(event) {
        var self = this;
        $(this.workspace.el).find('.workspace_fields').addClass('hide');
        $(this.el).find('.auto, .query_scenario, .buckets, .non_empty, .swap_axis, .mdx, .switch_to_mdx, .zoom_mode, .drillacross').parent().hide();

        if ($(this.workspace.el).find( ".workspace_results tbody.ui-selectable" ).length > 0) {
            $(this.workspace.el).find( ".workspace_results tbody" ).selectable( "destroy" );
        }


        $(this.el).find('.run').attr('href','#run_mdx');
        $(this.el).find('.run, .save, .open, .new, .edit').removeClass('disabled_toolbar');

        if (Settings.MODE != "view" && Settings.MODE != "table" && !this.workspace.isReadOnly) {
            $mdx_editor = $(this.workspace.el).find('.mdx_input');
            //$mdx_editor.width($(this.el).width()-5);
            $(this.workspace.el).find('.workspace_editor .mdx_input, .workspace_editor .editor_info, .workspace_editor').removeClass('hide').show();
            this.editor = ace.edit("mdx_editor");
            this.editor.setShowPrintMargin(false);
            this.editor.setFontSize(11);
            this.editor.commands.addCommand({
                name: 'runmdx',
                bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
                exec: function(editor) {
                    self.run_mdx();
                },
                readOnly: true // false if this command should not apply in readOnly mode
            });

            var showPosition = function() {
                var pos = self.editor.getCursorPosition();
                $mdx_editor.parent().find('.editor_info').html("&nbsp; " + (pos.row +1) + ", " + pos.column);
            };

            this.editor.on('changeSelection', showPosition);
            showPosition();

             var heightUpdateFunction = function() {

                // http://stackoverflow.com/questions/11584061/
                var max_height = $(document).height() / 3;
                var height = Math.floor(max_height / self.editor.renderer.lineHeight);
                var screen_length = self.editor.getSession().getScreenLength() > height ? height : self.editor.getSession().getScreenLength();
                var newHeight =
                          (screen_length + 1) *
                          self.editor.renderer.lineHeight +
                          self.editor.renderer.scrollBar.getWidth();

                $mdx_editor.height(newHeight.toString() + "px");
                self.editor.resize();
                self.workspace.adjust();
            };

            var resizeFunction = function() {
                var session = self.editor.session;
                //$mdx_editor.width($(self.el).width()-5);
                self.editor.resize();
                session.setUseWrapMode(true);
                if(session.getUseWrapMode()) {
                    var characterWidth = self.editor.renderer.characterWidth;
                    var contentWidth = self.editor.renderer.scroller.clientWidth;

                    if(contentWidth > 0) {
                        session.setWrapLimitRange(null, parseInt(contentWidth / characterWidth, 10));
                    }
                }
            };

            resizeFunction();

            heightUpdateFunction();

            self.editor.focus();
            self.editor.clearSelection();
            self.editor.getSession().setValue("");
            self.editor.getSession().on('change', heightUpdateFunction);
            $(window).resize(resizeFunction);

            self.editor.on('changeSelection', heightUpdateFunction);
            self.editor.on('focus', function(e) { heightUpdateFunction(); return true; });
            self.editor.on('blur', function(e) {
                    if ($(self.workspace.el).find(".mdx_input").height() > 100) {
                                $(self.workspace.el).find(".mdx_input").height(100);
                            }
                            self.editor.resize();
                            self.workspace.adjust();
             return true; });

            //this.editor.on('focusout', function(e) { alert('blur');  });

            //this.editor.setTheme("ace/theme/crimson_editor");
            this.editor.getSession().setMode("ace/mode/text");

        }



        if (this.workspace.dimension_list) {
            $(this.workspace.el).find('.sidebar_inner ul li a')
                .css({fontWeight: "normal"}).parent('li').removeClass('ui-draggable ui-draggable-disabled ui-state-disabled');
        }
        this.activate_buttons({ workspace: this.workspace });
        $(this.workspace.toolbar.el)
                .find('.run')
                .removeClass('disabled_toolbar');

        $(this.workspace.table.el).empty();
        this.workspace.adjust();
        this.post_mdx_transform();

    },



    post_mdx_transform: function() {
        var self = this;

        if (this.workspace.query.model.type !== "MDX") {
            //this.workspace.query.enrich();
            this.workspace.query.model.queryModel = {};
            this.workspace.query.model.type = "MDX";
            this.workspace.query.setProperty('saiku.olap.result.formatter', 'flat');
            self.workspace.query.helper.model().parameters = {};

        }
        var mdx = this.workspace.query.model.mdx;

        if (self.editor) {
            self.editor.setValue(mdx,0);
            self.editor.clearSelection();
            self.editor.focus();
        }
        $(self.el).find('.group_parents').removeClass('on');

        if (Settings.ALLOW_PARAMETERS) {

            var parameterDetector = function() {
                var mdx = self.editor.getValue();
                var parameters = [];
                if (mdx) {
                    for (var i = 0, len = mdx.length; i < (len-1); i++ ) {
                        if (mdx[i] === "$" && mdx[i+1] === "{") {
                            var param = "";
                            var closed = false;
                            for(i = i + 2; i < len; i++) {
                                if (mdx[i] !== '}') {
                                    param += mdx[i];
                                } else {
                                    closed = true;
                                    i++;
                                    break;
                                }
                            }
                            if (closed && param && param.length > 0) {
                                parameters.push(param);
                            }
                        }
                    }
                }
                var qParams = self.workspace.query.helper.model().parameters;
                var newParams = {};
                _.each(parameters, function(p) {
                    if (!qParams[p]) {
                        newParams[p] = "";
                    } else {
                        newParams[p] = qParams[p];
                    }

                });
                self.workspace.query.helper.model().parameters = newParams;
                self.workspace.update_parameters();


            };

			var lazyDetector = function() { _.delay(parameterDetector, 1000); };
			if (self.editor) {
				self.editor.getSession().off('change', lazyDetector);
				self.editor.getSession().on('change', lazyDetector);
			}
			self.workspace.update_parameters();
        }

    },

    run_mdx: function(event) {
        //var mdx = $(this.workspace.el).find(".mdx_input").val();
        if ($(this.workspace.el).find(".mdx_input").height() > 100) {
            $(this.workspace.el).find(".mdx_input").height(100);
        }
        this.editor.resize();
        var mdx = this.editor.getValue();
        this.workspace.query.model.mdx = mdx;
        this.workspace.query.run(true);
    },

    explain_query: function(event) {
        var self = this;
        var explained = function(model, args) {

            var explainPlan = "<textarea style='width: " + ($("body").width() - 165) + "px;height:" + ($("body").height() - 175) + "px;'>";
            if (args !== null && args.error !== null) {
                explainPlan += args.error;
            } else if (args.cellset && args.cellset.length === 0) {
                explainPlan += "Empty explain plan!";
            } else {
                explainPlan += args.cellset[1][0].value;
            }
            explainPlan += "</textarea>";

            Saiku.ui.unblock();

            var html = '<div id="fancy_results" class="workspace_results" style="overflow:visible"><table>' +
                       '<tr><th clas="row_header">Explain Plan</th></tr>' +
                       '<tr><td>' + explainPlan + '</td></tr>' +
                       '</table></div>';

            $.fancybox(html,
                {
                'autoDimensions'    : false,
                'autoScale'         : false,
                'height'            :  ($("body").height() - 100),
                'width'             :  ($("body").width() - 100),
                'transitionIn'      : 'none',
                'transitionOut'     : 'none'
                }
            );
        };

        self.workspace.query.action.gett("/explain", { success: explained } );

        return false;

    }
});
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
 * Sets up workspace drop zones for DnD and other interaction
 */
var WorkspaceDropZone = Backbone.View.extend({

    template: function() {
        var template = $("#template-workspace-dropzones").html() || "";
        return _.template(template)();
    },

    events: {
        'sortstop .fields_list_body.details': 'set_measures',
        'sortstop .axis_fields': 'select_dimension',
        'click .d_measure' : 'remove_measure_click',
        'click .d_level': 'selections',
        // 'click .d_measure span.sort' : 'sort_measure',
        'click .measure_fields.limit' : 'measure_action',
        'click .axis_fields_header.limit' : 'limit_axis',
        'click .clear_axis' : 'clear_axis'
    },

    initialize: function(args) {
        // Keep track of parent workspace
        this.workspace = args.workspace;

        // Maintain `this` in jQuery event handlers
        _.bindAll(this, "clear_axis", "set_measures");
    },

    render: function() {
        var self = this;
        // Generate drop zones from template
        $(this.el).html(this.template());

        // Activate drop zones
        $(this.el).find('.fields_list_body.details ul.connectable').sortable({
            items:          '> li',
            opacityg:        0.60,
            placeholder:    'placeholder',
            tolerance:      'pointer',
            containment:    $(self.workspace.el),
            start:          function(event, ui) {
                ui.placeholder.text(ui.helper.text());
            }
        });

        $(this.el).find('.axis_fields ul.connectable').sortable({
            connectWith: $(self.el).find('.axis_fields ul.connectable'),
            forcePlaceholderSize:   false,
            forceHelperSize:        true,
            items:                  'li.selection',
            opacity:                0.60,
            placeholder:            'placeholder',
            tolerance:              'touch',
            cursorAt:               { top: 10, left: 60 },
            containment:            $(self.workspace.el),
            start:                  function(event, ui) {
                var hierarchy = $(ui.helper).find('a').parent().parent().attr('hierarchycaption');
                ui.placeholder.text(hierarchy);
                $(ui.helper).css({ width: "auto", height: "auto"});
                $(self.el).find('.axis_fields ul.hierarchy li.d_level:visible').addClass('temphide').hide();
            }
        });

        return this;
    },

    set_measures: function(event, ui) {
        var details = [];

        $(this.el).find('.fields_list_body.details ul.connectable li.d_measure').each( function(index, element) {
            var measure = {
                "name": $(element).find('a').attr('measure'),
                "type": $(element).find('a').attr('type')
            };
            details.push(measure);
            Saiku.events.trigger("workspaceDropZone:select_measure", this,
                {measure:measure});
        });
        this.workspace.query.helper.setMeasures(details);
        this.workspace.sync_query();
        this.workspace.query.run();

    },

    remove_measure_click: function(event) {
        event.preventDefault();
        var target = $(event.target).hasClass('d_measure') ?  $(event.target).find('a') :  $(event.target);
        target.parent().remove();
        this.set_measures();
    },

    remove_dimension: function(event, ui) {
        if ($(ui.helper).hasClass('d_measure')) {
                $(ui.helper).detach();
                this.set_measures();
        } else {
            var hierarchy = $(ui.helper).find('a').attr('hierarchy');
            var fromAxis = $(this.el).find('ul.hierarchy[hierarchy="' + hierarchy + '"]').parents('.fields_list').attr('title');
            var level =  $(ui.helper).find('a').attr('level');
            this.workspace.query.helper.removeHierarchy(hierarchy);
            this.workspace.sync_query();
            this.workspace.query.run();
        }
    },

    synchronize_query: function() {
        var self = this;
        this.reset_dropzones();

        var model = this.workspace.query.helper.model();

        if (model.hasOwnProperty('queryModel') && model.queryModel.hasOwnProperty('axes')) {
            var axes = model.queryModel.axes;

            for (var axis in axes) {
                var $axis = $(self.el).find('.fields_list[title="' + axis + '"]');
                _.each(axes[axis].hierarchies, function(hierarchy) {
                    var h = $(self.workspace.dimension_list.el).find('ul.d_hierarchy[hierarchy="' + hierarchy.name + '"]').clone().removeClass('d_hierarchy').addClass('hierarchy');
                    h.find('li.d_level').hide();
                    for (var level in hierarchy.levels) {
                        h.find('li a[level="' + level + '"]').parent().show();

                        // sync attribute list
                        $(self.workspace.dimension_list.el).find('ul.d_hierarchy[hierarchy="' + hierarchy.name + '"] li a[level="' + level + '"]').parent()
                            .draggable('disable')
                            .parents('.parent_dimension')
                            .find('.folder_collapsed')
                            .addClass('selected');
                    }
                    for (var member in hierarchy.cmembers) {
                        if (hierarchy.cmembers.hasOwnProperty(member)) {
                            var level = member.split('.')[member.split('.').length-1].replace(/[\[\]]/gi, '');

                            h.find('li a[level="' + level + '"]').parent().show();

                            // sync attribute list
                            $(self.workspace.dimension_list.el).find('ul.d_hierarchy[hierarchy="' + hierarchy.name + '"] li a[level="' + level + '"]').parent()
                                .draggable('disable')
                                .parents('.parent_dimension')
                                .find('.folder_collapsed')
                                .addClass('selected');
                        }
                    }
                    var selection = $('<li class="selection"></li>');
                    selection.append(h);
                    selection.appendTo($axis.find('ul.connectable'));
                });
            }
            var measures = model.queryModel.details.measures || [];
            _.each(measures, function (measure) {
                var m = $(self.workspace.dimension_list.el).find('.measure_tree a.measure[measure="' + measure.name + '"]').parent();
                var m2 = m.clone().show();
                m2.appendTo( $(self.el).find('.fields_list_body.details ul.connectable'));

                m.draggable('disable');
            });

            this.update_dropzones();
        }
    },

    reset_dropzones: function() {
        var self = this;
        $(self.el).find('.fields_list_body ul.connectable').find('li.selection, li.d_measure').remove();
        $(self.workspace.dimension_list.el).find('li.ui-draggable-disabled').draggable('enable');
        $(self.el).find('.fields_list[title="ROWS"] .limit').removeClass('on');
        $(self.el).find('.fields_list[title="COLUMNS"] .limit').removeClass('on');
        $(this.workspace.el).find('.fields_list_body .clear_axis').addClass('hide');
    },

    update_dropzones: function() {
        $(this.workspace.el).find('.fields_list_body').each(function(idx, ael) {
            var $axis = $(ael);
            if ($axis.find('ul.connectable li.selection, ul.connectable li.d_measure').length === 0) {
                $axis.siblings('.clear_axis').addClass('hide');
            } else {
                $axis.siblings('.clear_axis').removeClass('hide');
            }
        });

    },

    clear_axis: function(event) {
        var self = this;
        event.preventDefault();
        var axis = $(event.target).siblings('.fields_list_body').parent().attr('title');
        if (axis == "DETAILS") {
            this.workspace.query.helper.clearMeasures();
        } else {
            this.workspace.query.helper.clearAxis(axis);
        }

        // Trigger event when clear axis
        Saiku.session.trigger('workspaceDropZone:clear_axis', { workspace: this.workspace, axis: axis });

        this.workspace.sync_query();
        this.workspace.query.run();
        return false;
    },

    select_dimension: function(event, ui) {
        var self = this;
        // if we drop to remove dont execute the following

        // Trigger event when select dimension
        Saiku.session.trigger('workspaceDropZone:select_dimension', { workspace: this.workspace });

        if ($(ui.item).is(':visible')) {
            $(self.el).find('.axis_fields ul.hierarchy').each( function(index, element) {
                $(element).find('li.temphide').show().removeClass('temphide');
            });

            var hierarchy = ui.item.find('.level').attr('hierarchy');
            var indexHierarchy = -1;
            ui.item.parents('ul.connectable').find('li.selection').each( function(index, element) {
                if ( $(element).find('ul.hierarchy').attr('hierarchy') == hierarchy) {
                    indexHierarchy = index;
                }
            });

            var toAxis = ui.item.parents('.axis_fields').parent().attr('title');
            var fromAxis = $(event.target).parents('.axis_fields').parent().attr('title');
            var isNew = ui.item.hasClass('d_level');
            var isCalcMember = ui.item.hasClass('dimension-level-calcmember');

            var level;
            var uniqueName;
            if (isCalcMember) {
                uniqueName = ui.item.find('a.level').attr('uniquename');
                this.workspace.toolbar.$el.find('.group_parents').removeClass('on');
                this.workspace.toolbar.group_parents();
                this.workspace.query.helper.includeLevelCalculatedMember(toAxis, hierarchy, level, uniqueName, indexHierarchy);
            }
            else {
                if (isNew) {
                    level = ui.item.find('a.level').attr('level');
                    this.workspace.query.helper.includeLevel(toAxis, hierarchy, level, indexHierarchy);
                } else {
                    self.workspace.query.helper.moveHierarchy(fromAxis, toAxis, hierarchy, indexHierarchy);
                }
            }

            $(ui.item).detach();
            this.workspace.sync_query();
            self.workspace.query.run();
            Saiku.events.trigger("workspaceDropZone:select_dimension", this,
                {level: level, uniquename: uniqueName, toAxis: toAxis, isNew: isNew, isCalc: isCalcMember, hierarchy:hierarchy});
            return;
        }
        return;
    },

	find_type_time: function (dimension, hierarchy, level) {
        if (this.workspace.metadata === undefined) {
            this.workspace.metadata = Saiku.session.sessionworkspace.cube[this.workspace.selected_cube];
        }
		var metadata = this.workspace.metadata.attributes.data,
			value = {};
		value.dimensions = _.findWhere(metadata.dimensions, { name: dimension });
		if (hierarchy === undefined) {
			hierarchy = dimension;
		}
		value.hierarchies = _.findWhere(value.dimensions.hierarchies, { name: hierarchy });
		if (value.hierarchies === undefined || value.hierarchies === null) {
			value.hierarchies = _.findWhere(value.dimensions.hierarchies, { name: dimension + '.' + hierarchy });
		}
		value.level = _.findWhere(value.hierarchies.levels, { name: level });
		if(value.level === null || value.level === undefined) {
			value.level = _.findWhere(value.hierarchies.levels, { caption: level });
		}
		return value;
	},

    selections: function(event, ui) {
        if (event) {
            event.preventDefault();
        }

        // Determine dimension
        var $target = $(event.target).hasClass('d_level') ?
            $(event.target).find('.level') :
            $(event.target);
		var dimension = $target.attr('hierarchy').replace(/[\[\]]/gi, '').split('.')[0],
			hierarchy = $target.attr('hierarchy').replace(/[\[\]]/gi, '').split('.')[1]
				? $target.attr('hierarchy').replace(/[\[\]]/gi, '').split('.')[1]
				: $target.attr('hierarchy').replace(/[\[\]]/gi, '').split('.')[0],
            level = $target.attr('level'),
            objData = this.find_type_time(dimension, hierarchy, level),
            dimHier = $target.attr('hierarchy'),
            key = $target.attr('href').replace('#', '');

        // Fetch available members
        this.member = new Member({}, {
            cube: this.workspace.selected_cube,
            dimension: key
        });

        var hName = decodeURIComponent(this.member.hierarchy),
            memberHierarchy = this.workspace.query.helper.getHierarchy(hName),
            memberLevel;

        if (memberHierarchy && memberHierarchy.levels.hasOwnProperty(level)) {
            memberLevel = memberHierarchy.levels[level];
        }

        if ((objData.level && objData.level.annotations !== undefined && objData.level.annotations !== null) &&
           (objData.level.annotations.AnalyzerDateFormat !== undefined || objData.level.annotations.SaikuDayFormatString !== undefined) &&
           ((_.has(memberLevel, 'selection') && memberLevel.selection.members.length === 0) ||
           ((_.size(memberLevel) === 1 && _.has(memberLevel, 'name')) || (_.has(memberLevel, 'mdx') && memberLevel.mdx) || 
           (_.size(memberLevel) === 2 && _.has(memberLevel, 'name') && _.has(memberLevel, 'mdx'))))) {

            // Launch date filter dialog
            (new DateFilterModal({
                dimension: dimension,
                hierarchy: hierarchy,
                target: $target,
                name: $target.attr('level'),
                data: objData,
                analyzerDateFormat: objData.level.annotations.AnalyzerDateFormat,
                dimHier: dimHier,
                key: key,
                workspace: this.workspace
            })).open();
        }
        else {
            // Launch selections dialog
            (new SelectionsModal({
                target: $target,
                name: $target.text(),
                key: key,
                workspace: this.workspace
            })).open();
        }

        return false;
    },

	measure_action: function(event) {
		var self = this;
		if (typeof this.workspace.query == "undefined" || this.workspace.query.model.type != "QUERYMODEL" || Settings.MODE == "view") {
			return false;
		}
		var $target = $(event.target).hasClass('limit') ? $(event.target) : $(event.target).parent();
		var menuitems = {
			"HEADER": {name: "Position", disabled:true, i18n: true },
			"sep1": "---------",
			"BOTTOM_COLUMNS": {name: "Columns | Measures", i18n: true },
			"TOP_COLUMNS": {name: "Measures | Columns", i18n: true },
			"BOTTOM_ROWS": {name: "Rows | Measures", i18n: true },
			"TOP_ROWS": {name: "Measures | Rows", i18n: true },
			"sep2": "---------",
			"reset": {name: "Reset Default", i18n: true },
			"cancel": {name: "Cancel", i18n: true }
		};
		$.each(menuitems, function(key, item){
			recursive_menu_translate(item, Saiku.i18n.po_file);
		});
		$.contextMenu('destroy', '.limit');
		$.contextMenu({
			appendTo: $target,
			selector: '.limit',
			ignoreRightClick: true,
			build: function($trigger, e) {
				var query = self.workspace.query;
				var cube = self.workspace.selected_cube;
				return {
					callback: function(key, options) {
						var details = query.helper.model().queryModel.details;
						if (key === "cancel") {
							return;
						}
						if ( key === "reset") {
							details.location = SaikuOlapQueryTemplate.queryModel.details.location;
							details.axis = SaikuOlapQueryTemplate.queryModel.details.axis;
						} else {
							var location = key.split('_')[0];
							var axis = key.split('_')[1];
							details.location = location;
							details.axis = axis;
						}
						query.run();
					},
					items: menuitems
				}
			}
		});
		$target.contextMenu();
	},

    limit_axis: function(event) {
        var self = this;

        if (typeof this.workspace.query == "undefined" || this.workspace.query.model.type != "QUERYMODEL" || Settings.MODE == "view") {
            return false;
        }

        var $target =  $(event.target).hasClass('limit') ? $(event.target) : $(event.target).parent();
        var $axis = $target.siblings('.fields_list_body');
        var target = $axis.parent().attr('title');

        $.contextMenu('destroy', '.limit');
        $.contextMenu({
            appendTo: $target,
            selector: '.limit',
            ignoreRightClick: true,
             build: function($trigger, e) {
                var query = self.workspace.query;
                var cube = self.workspace.selected_cube;
                var items = {};
                var measures = Saiku.session.sessionworkspace.cube[cube].get('data').measures;
                var a = self.workspace.query.helper.getAxis(target);

                var func, n, sortliteral, filterCondition, sortOrder, sortOrderLiteral, sortHl, topHl, filterHl, totalFunction;
                var isFilter = false, isSort = false, isTop = false, isStringFilter = false;
                if (a && a.filters) {
                    _.each(a.filters, function(filter) {
                        if (filter.flavour == "N") {
                            func = a["function"];
                            n = filter.expressions[0];
                            sortliteral = filter.expressions[1];
                            isTop = true;
                        }
                        if (filter.flavour == "Generic") {
                            filterCondition = filter.expressions[0];
                            isFilter = true;
                        }
                        if(filter.flavour == "NameLike" || filter.flavour == "Name"){
                            filterCondition = filter.expressions[0];
                            isStringFilter = true;
                        }
                    });
                }
                if (a && a.sortOrder) {
                    sortOrder = a.sortOrder;
                    sortOrderLiteral = a.sortEvaluationLiteral;
                    isSort = true;
                }
                if (a && a.aggregators && a.aggregators.length > 0) {
                    totalFunction = a.aggregators[0];
                }

                if (func !== null && sortliteral === null) {
                    topHl = func + "###SEPARATOR###" + n;
                } else if (func !== null && sortliteral !== null && n !== null) {
                    topHl = "custom";
                }

                if (isSort && sortOrder !== null) {
                    sortHl = "customsort";
                }

                _.each(measures, function(measure) {
                    items[measure.uniqueName] = {
                        name: measure.caption,
                        payload: {
                            "n"     : 10,
                            "sortliteral"    : measure.uniqueName
                        }
                    };
                });
                var levels=[];
				 _.each(a.hierarchies, function(hierarchy){
					 for(var property in hierarchy.levels){
						 console.log(property);
						 var n ="";
						 if(hierarchy.levels[property].caption!=null){
							 n = hierarchy.levels[property].caption;
						 }
						 else{
							 n = hierarchy.levels[property].name;
						 }
						 levels[hierarchy.levels[property].name] = {
							 name: n
						 }
					 }
                });
                var addFun = function(items, fun) {
                    var ret = {};
                    for (var key in items) {
                        ret[ (fun + '###SEPARATOR###'+ key) ] = _.clone(items[key]);
                        ret[ (fun + '###SEPARATOR###' + key) ].fun = fun;
                        if (fun == func && sortliteral == key && items[key].payload.n == n) {
                            topHl = fun + "Quick";
                            ret[ (fun + '###SEPARATOR###' + key) ].name =
                                    "<b>" + items[key].name + "</b>";
                        }
                        if (fun == sortOrder && sortOrderLiteral == key) {
                            sortHl = fun + "Quick";
                            ret[ (fun + '###SEPARATOR###' + key) ].name =
                                    "<b>" + items[key].name + "</b>";
                        }
                    }
                    return ret;
                };

                var citems = {
                        "filter" : {name: "Filter", i18n: true, items:
                         {
                                "customfilter": {name: "Custom...", i18n: true },
                                "stringfilter": {name: "String Filter", i18n: true },
                                "clearfilter": {name: "Clear Filter", i18n: true }
                         }},
                        "limit" : {name: "Limit", i18n: true, items:
                        {
                                "TopCount###SEPARATOR###10": {name: "Top 10", i18n: true },
                                "BottomCount###SEPARATOR###10": {name: "Bottom 10", i18n: true },
                                "TopCountQuick" : { name: "Top 10 by...", i18n: true, items: addFun(items, "TopCount") },
                                "BottomCountQuick" : { name: "Bottom 10 by...", i18n: true, items: addFun(items, "BottomCount") },
                                "customtop" : {name: "Custom Limit...", i18n: true },
                                "clearlimit" : {name: "Clear Limit", i18n: true }
                         }},
                        "sort" : {name: "Sort", i18n: true, items:
                        {
                            "ASCQuick": {name: "Ascending" , i18n: true, items: addFun(items, "ASC") },
                            "DESCQuick": {name: "Descending", i18n: true, items: addFun(items, "DESC")},
                            "BASCQuick": {name: "Ascending (Breaking Hierarchy)", i18n: true, items: addFun(items, "BASC")},
                            "BDESCQuick": {name: "Descending (Breaking Hierarchy)", i18n: true, items: addFun(items, "BDESC") },
                            "customsort" : { name: "Custom...", i18n: true },
                            "clearsort" : {name: "Clear Sort", i18n: true }
                        }},
                        "grand_totals" : {name: "Grand totals", i18n: true, items:
                        {
                            "show_totals_not": {name: "None", i18n: true},
                            "show_totals_sum": {name: "Sum", i18n: true},
                            "show_totals_min": {name: "Min", i18n: true},
                            "show_totals_max": {name: "Max", i18n: true},
                            "show_totals_avg": {name: "Avg", i18n: true}
                        }},
                        "cancel" : { name: "Cancel", i18n: true }

                };
                $.each(citems, function(key, item){
                    recursive_menu_translate(item, Saiku.i18n.po_file);
                });

                var totalItems = citems.grand_totals.items;
                if (totalFunction) {
                    for (var key in totalItems) {
                        if (key.substring("show_totals_".length) == totalFunction) {
                            totalItems[key].name = "<b>" + totalItems[key].name + "</b";
                        }
                    }
                } else {
                    totalItems.show_totals_not.name = "<b>" + totalItems.show_totals_not.name + "</b";
                }

                items["10"] = {
                   payload: { "n" : 10 }
                };

                if (isFilter) {
                    var f = citems.filter;
                    f.name = "<b>" + f.name + "</b>";
                    f.items.customfilter.name = "<b>" + f.items.customfilter.name + "</b>";
                }
                 if (isStringFilter) {
                     var f = citems.filter;
                     f.name = "<b>" + f.name + "</b>";
                     f.items.stringfilter.name = "<b>" + f.items.stringfilter.name + "</b>";
                 }
                if (isSort) {
                    var s = citems.sort.items;
                    citems.sort.name = "<b>" + citems.sort.name + "</b>";
                    if (sortHl in s) {
                        s[sortHl].name = "<b>" + s[sortHl].name + "</b>";
                    }
                }
                if (isTop) {
                    var t = citems.limit.items;
                    citems.limit.name = "<b>" + citems.limit.name + "</b>";
                    if (topHl in t) {
                        t[topHl].name = "<b>" + t[topHl].name + "</b>";
                    }
                }

                return {
                    callback: function(key, options) {
                            var save_custom,
                                save_customsort;

                            if (key == "cancel") {
                                return;
                            }

                            if (key == "clearfilter") {
                                $target.removeClass('on');
                                self.workspace.query.helper.removeFilter(a, 'Generic');
                                self.synchronize_query();
                                self.workspace.query.run();
                            } else if (key == "customfilter") {
                                save_custom = function(filterCondition) {
                                    var expressions = [];
                                    expressions.push(filterCondition);

                                    self.workspace.query.helper.removeFilter(a, 'Generic');
                                    a.filters.push(
                                        {   "flavour" : "Generic",
                                            "operator": null,
                                            "function" : "Filter",
                                            "expressions": expressions
                                        });
                                    self.synchronize_query();
                                    self.workspace.query.run();
                                };

                                 (new FilterModal({
                                    axis: target,
                                    success: save_custom,
                                    query: self.workspace.query,
                                    expression: filterCondition,
                                    expressionType: "Filter",
                                     workspace: self.workspace
                                })).render().open();

                            } else if (key == "stringfilter") {
                                save_custom = function(filterCondition, matchtype, filtervalue) {
                                    var expressions = [];
                                    _.each(filtervalue, function(f){
                                        expressions.push(filterCondition,f);
                                    });

                                    if(matchtype === "EQUALS" || matchtype === "NOTEQUAL"){
                                        //self.workspace.query.helper.removeFilter(a, 'NameLike');
                                        var o = null;
                                        if(matchtype === "NOTEQUAL"){
                                            o = "NOTEQUAL"
                                        }
                                        a.filters.push(
                                            {   "flavour" : "Name",
                                                "operator": o,
                                                "function" : "Filter",
                                                "expressions": expressions
                                            });
                                    }
                                    else{
                                        //self.workspace.query.helper.removeFilter(a, 'NameLike');
                                        var o = null;
                                        if(matchtype === "NOTLIKE"){
                                            o = "NOTEQUAL"
                                        }
                                        a.filters.push(
                                            {   "flavour" : "NameLike",
                                                "operator": o,
                                                "function" : "Filter",
                                                "expressions": expressions
                                            });

                                    }

                                    self.synchronize_query();
                                    //self.workspace.query.run();
                                };

                                (new StringFilterModal({
                                    axis: target,
                                    success: save_custom,
                                    query: self.workspace.query,
                                    expression: filterCondition,
                                    expressionType: "Filter",
                                    workspace: self.workspace
                                })).render().open();

                            } else if (key == "clearlimit") {
                                $target.removeClass('on');
                                self.workspace.query.helper.removeFilter(a, 'N');
                                self.synchronize_query();
                                self.workspace.query.run();
                            } else if (key == "customtop") {

                                save_custom = function(fun, n, sortliteral) {
                                    var expressions = [];
                                    expressions.push(n);
                                    if (sortliteral) {
                                        expressions.push(sortliteral);
                                    }

                                    self.workspace.query.helper.removeFilter(a, 'N');
                                    a.filters.push(
                                        {   "flavour" : "N",
                                            "operator": null,
                                            "function" : fun,
                                            "expressions": expressions
                                        });
                                    self.synchronize_query();
                                    self.workspace.query.run();
                                };

                                 (new CustomFilterModal({
                                    axis: target,
                                    measures: measures,
                                    success: save_custom,
                                    query: self.workspace.query,
                                    func: func,
                                    n: n,
                                    sortliteral: sortliteral
                                })).render().open();
                            } else if (key == "customsort") {

                                save_customsort = function(sortO, sortL) {
                                    a.sortOrder = sortO;
                                    a.sortEvaluationLiteral = sortL;
                                    self.synchronize_query();
                                    self.workspace.query.run();
                                };

                                 (new FilterModal({
                                    axis: target,
                                    success: save_customsort,
                                    query: self.workspace.query,
                                    expression: sortOrderLiteral,
                                    expressionType: "Order"
                                })).render().open();
                            } else if (key == "clearsort") {
                                a.sortOrder = null;
                                a.sortEvaluationLiteral = null;
                                self.synchronize_query();
                                self.workspace.query.run();
                            } else if (key.indexOf("show_totals_") === 0){
                                var total = key.substring("show_totals_".length);
                                var aggs = [];
                                aggs.push(total);
                                a.aggregators = aggs;
                                self.workspace.query.run();
                            } else {

                                var fun = key.split('###SEPARATOR###')[0];
                                var ikey = key.split('###SEPARATOR###')[1];
                                var method = "";
                                var data = {};
                                if (_.indexOf(["ASC", "BASC", "DESC", "BDESC"], fun) > -1) {
                                    a.sortOrder = fun;
                                    a.sortEvaluationLiteral = items[ikey].payload.sortliteral;

                                }
								else if(_.indexOf(["Param"], fun) > -1) {
									console.log("here");
									a.sortEvaluationLiteral = items[ikey].payload.sortliteral;
								}else {
                                    var expressions = [];
                                    expressions.push(items[ikey].payload.n);
                                    var sl = items[ikey].payload.sortliteral;
                                    if (sl) {
                                        expressions.push(sl);
                                    }

                                    self.workspace.query.helper.removeFilter(a, 'N');
                                    a.filters.push(
                                        {   "flavour" : "N",
                                            "operator": null,
                                            "function" : fun,
                                            "expressions": expressions
                                        });
                                }
                                self.synchronize_query();
                                self.workspace.query.run();
                            }
                    },
                    items: citems
                };
            }
        });
    $target.contextMenu();
    }
});
/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2015
 */

/**
 * Class which handles table rendering of resultsets
 */
var Table = Backbone.View.extend({
    className: 'table_wrapper',
    events: {
        'click th.row' : 'clicked_cell',
        'click th.col' : 'clicked_cell'
    },

    initialize: function(args) {
        this.workspace = args.workspace;
        this.renderer = new SaikuTableRenderer();

        // Bind table rendering to query result event
        _.bindAll(this, "render", "process_data");
        this.workspace.bind('query:result', this.render);
        this.id = _.uniqueId("table_");
        $(this.el).attr('id', this.id);
    },

    clicked_cell: function(event) {
        var self = this;

        //return false;
        if (/*this.workspace.query.get('type') != 'QM' ||*/ Settings.MODE == "table") {
            //return false;
        }
        if ($(this.workspace.el).find( ".workspace_results.ui-selectable" ).length > 0) {
            $(this.workspace.el).find( ".workspace_results" ).selectable( "destroy" );
        }

        var $target = ($(event.target).hasClass('row') || $(event.target).hasClass('col') ) ?
            $(event.target).find('div') : $(event.target);

        var $body = $(document);
        $.contextMenu('destroy', '.row, .col');
        $.contextMenu({
            appendTo: $target,
            selector: '.row, .col',
            ignoreRightClick: true,
            build: function($trigger, e) {
                var $target = $(e.currentTarget).find('div');
                var axis = $(e.currentTarget).hasClass('row') ? "ROWS" : "COLUMNS";
                var pos = $target.attr('rel').split(':');
                var row = parseInt(pos[0]);
                var col = parseInt(pos[1]);
                var cell = self.workspace.query.result.lastresult().cellset[row][col];
                var query = self.workspace.query;
                var schema = query.get('schema');
                var cube = query.get('connection') + "/" +
                    query.get('catalog') + "/" +
                    ((schema === "" || schema === null) ? "null" : schema) +
                    "/" + query.get('cube');

                var d = cell.properties.dimension;
                var h = cell.properties.hierarchy;
                var l = cell.properties.level;
                var l_caption = "";

                var keep_payload = JSON.stringify(
                        {
                            "hierarchy"     :  h,
                            "uniquename"    : l,
                            "type"          : "level",
                            "action"        : "delete"
                        }) +
                    "," + JSON.stringify(
                        {
                            "hierarchy"     :  h,
                            "uniquename"    : cell.properties.uniquename,
                            "type"          : "member",
                            "action"        : "add"
                        }
                    );

                var children_payload = cell.properties.uniquename;

                var levels = [];
                var items = {};
                var key = self.workspace.selected_cube;
                var cubeModel = Saiku.session.sessionworkspace.cube[key];

                var dimensions;
                if (!cubeModel || !dimensions || !measures) {
                    if (typeof localStorage !== "undefined" && localStorage && localStorage.getItem("cube." + key) !== null) {
                        Saiku.session.sessionworkspace.cube[key] = new Cube(JSON.parse(localStorage.getItem("cube." + key)));
                    } else {
                        Saiku.session.sessionworkspace.cube[key] = new Cube({ key: key });
                        Saiku.session.sessionworkspace.cube[key].fetch({ async : false });
                    }
                    dimensions = Saiku.session.sessionworkspace.cube[key].get('data').dimensions;
                }
                var used_levels = [];

                var v1 = self.workspace.query.helper.getHierarchy(h);
                var v2 =
                    _.each(v1.levels, function(level){
                        var lev = h+".["+level.name+"]";
                        used_levels.push(lev);
                    });
                _.each(dimensions, function(dimension) {
                    if (dimension.name == d) {
                        _.each(dimension.hierarchies, function(hierarchy) {
                            if (hierarchy.uniqueName == h) {
                                _.each(hierarchy.levels, function(level) {
                                    items[level.name] = {
                                        name: level.caption,
                                        payload: JSON.stringify({
                                            "hierarchy"     : h,
                                            uniquename    : level.uniqueName,
                                            type          : "level",
                                            action        : "add"
                                        })
                                    };
                                    if(_.indexOf(used_levels, level.uniqueName) > -1) {
                                        items[level.name].disabled = true;
                                        items["remove-" + level.name] = {
                                            name: level.caption,
                                            payload: JSON.stringify({
                                                "hierarchy"     :  h,
                                                uniquename    : level.uniqueName,
                                                type          : "level",
                                                action        : "delete"
                                            })
                                        };

                                    }
                                    if (level.uniqueName == l) {
                                        l_caption = level.caption;
                                        l_name = level.name;
                                    }
                                    items["keep-" + level.name] = items[level.name];
                                    items["include-" + level.name] = JSON.parse(JSON.stringify(items[level.name]));
                                    items["keep-" + level.name].payload = keep_payload + "," + items[level.name].payload;
                                });
                            }
                        });
                    }
                });
                items.keeponly = { payload: keep_payload };
                items.getchildren = { payload: children_payload };
                if (items.hasOwnProperty("remove-" + l_name) && items.hasOwnProperty("include-" + l_name)) {
                    items.showall = { payload: items["remove-" + l_name].payload + ", " + items["include-" + l_name].payload};
                }



                var lvlitems = function(prefix) {
                    var ritems = {};
                    for (var key in items) {
                        if (prefix !== null && prefix.length < key.length && key.substr(0, prefix.length) == prefix) {
                            ritems[key] = items[key];
                        }
                    }
                    return ritems;
                };

                var member = $target.html();

                var citems = {
                    "name" : {name: "<b>" + member + "</b>", disabled: true },
                    "sep1": "---------",
                    "keeponly": {name: "Keep Only", i18n: true, payload: keep_payload }
                };
                if (d != "Measures") {
                    //citems.getchildren = {name: "Show Children", i18n: true, payload: children_payload };
                    citems.fold1key = {
                        name: "Include Level", i18n: true,
                        items: lvlitems("include-")
                    };
                    citems.fold2key = {
                        name: "Keep and Include Level", i18n: true,
                        items: lvlitems("keep-")
                    };
                    citems.fold3key = {
                        name: "Remove Level", i18n: true,
                        items: lvlitems("remove-")
                    };
                    citems.filterlevel = {
                        name: "Filter Level", i18n: true
                    };
                    /*if (items.showall) {
                     citems.showall  =  { name: "Remove Filters", i18n: true };
                     }*/
                }
                $.each(citems, function(key, item){
                    recursive_menu_translate(item, Saiku.i18n.po_file);
                });
                return {
                    callback: function(key, options) {
                        var updates = [];

                        if(key === "keeponly") {

                            //self.workspace.query.helper.removeLevel(h, k);
                            var hierarchy = self.workspace.query.helper.getHierarchy(h);
                            if (hierarchy && hierarchy.levels.hasOwnProperty(l_caption)) {
                                updates.push({
                                    uniqueName: cell.properties.uniquename,
                                    caption: cell.properties.uniquename
                                });
                                hierarchy.levels[l_caption].selection = {"type": "INCLUSION", "members": updates};
                                self.workspace.drop_zones.synchronize_query();
                                self.workspace.query.run(true);
                            }
                        }
                        else if(key === "filterlevel"){
                            var lname = cell.properties.level.substring(cell.properties.level.lastIndexOf(".")+1);
                            lname = lname.replace("[","").replace("]","");
                            (new SelectionsModal({
                                target: $target,
                                name: "Filter Level",
                                key: cell.properties.hierarchy+"/"+lname,
                                workspace: self.workspace,
                                axis: "ROWS"
                            })).open();
                        }
                        else if(key.substring(0,key.indexOf("-")) === "remove"){
                            var k = key.substring(key.indexOf("-") + 1);

                            self.workspace.query.helper.removeLevel(h, k);
                            self.workspace.drop_zones.synchronize_query();
                            self.workspace.query.run(true);

                        }
                        else if(key.substring(0,key.indexOf("-")) === "keep"){


                            //Keep and Include
                            var k = key.substring(key.indexOf("-") + 1);

                            //self.workspace.query.helper.removeLevel(h, k);
                            var hierarchy = self.workspace.query.helper.getHierarchy(h);
                            if (hierarchy && hierarchy.levels.hasOwnProperty(l_caption)) {
                                updates.push({
                                    uniqueName: cell.properties.uniquename,
                                    caption: cell.properties.uniquename
                                });
                                hierarchy.levels[l_caption].selection = {"type": "INCLUSION", "members": updates};
                                self.workspace.query.helper.includeLevel(axis, h, k, null);
                                self.workspace.drop_zones.synchronize_query();
                                self.workspace.query.run(true);
                            }
                        }
                        else if(key.substring(0,key.indexOf("-")) === "include"){
                            //Include
                            var k =  key.substring(key.indexOf("-") + 1);
                            self.workspace.query.helper.includeLevel(axis, h, k, null);
                            self.workspace.drop_zones.synchronize_query();
                            self.workspace.query.run(true);
                        }

                    },
                    items: citems
                };
            }
        });
        $target.contextMenu();

    },


    render: function(args, block) {

        if (typeof args == "undefined" || typeof args.data == "undefined" || 
            ($(this.workspace.el).is(':visible') && !$(this.el).is(':visible'))) {
            return;
        }

        if (args.data !== null && args.data.error !== null) {
            return;
        }        
        // Check to see if there is data
        if (args.data === null || (args.data.height && args.data.height === 0)) {
            return;
        }
        this.clearOut();
        $(this.el).html('Rendering ' + args.data.width + ' columns and ' + args.data.height + ' rows...');

        // Render the table without blocking the UI thread
        _.delay(this.process_data, 2, args.data);

    },

    clearOut: function() {
        // Do some clearing in the renderer
        this.renderer.clear();
        $(this.workspace.el).find( ".workspace_results" ).unbind('scroll');
        var element = document.getElementById(this.id);
        var table = element.firstChild;
        if (table) {
            element.removeChild(table);
        }

    },

    template_filter: function(obj) {
        return _.template(
            '<div class="table-applied-filter">' +
                '<p>Applied filters:</p>' +
                '<table>' +
                    '<% _.each(obj, function(value) { %>' +
                        '<tr>' +
                            '<td><%= value.hName %> <span style="float: right">&#187;</span></td>' +
                            '<% if (value.members && !(_.isEmpty(value.members))) { %>' +
                                '<td><%= value.lName %> <span style="float: right">&#187;</span></td>' +
                                '<td><%= value.members[0] %></td>' +
                            '<% } else { %>' +
                                '<td><%= value.lName %></td>' +
                            '<% } %>' +
                        '</tr>' +
                        '<% if (value.members && value.members.length > 1) { %>' +
                            '<% _.each(_.rest(value.members), function(value, key, list) { %>' +
                                '<tr>' +
                                    '<td colspan="2"><span style="float: right">&#187;</span></td>' +
                                    '<td><%= list[key] %></td>' +
                                '</tr>' +
                            '<% }); %>' +
                        '<% } %>' +
                    '<% }); %>' +
                '</table>' +
            '</div>'
        )(obj);
    },

    process_filter: function() {
        var filters = this.workspace.query.helper.getAxis('FILTER'),
            dataFilter = [];
        
        if (filters!=null && filters.hierarchies && !(_.isEmpty(filters.hierarchies))) {
            _.each(filters.hierarchies, function(hier) {
                _.each(hier.levels, function(level) {
                    dataFilter.push({
                        hName: hier.caption,
                        lName: level.name
                    });
                    _.find(dataFilter, function(value) {
                        if (value.lName === level.name) {
                            value.members = [];
                            _.each(level.selection.members, function(member) {
                                value.members.push(member.name);
                            });
                        }
                    });
                });
            });
        }
        else {
            dataFilter = null;
        }

        return dataFilter;
    },

    process_data: function(data) {
        var dataFilter = this.process_filter(),
            $htmlFilter = dataFilter ? this.template_filter(dataFilter) : '';
        this.workspace.processing.hide();
        this.workspace.adjust();
        // Append the table
        this.clearOut();
        $(this.el).html('<table id="' + this.id + '"></table>').append($htmlFilter);
        var contents = this.renderer.render(data, { 
            htmlObject:         $(this.el).find('#' + this.id),
            batch:              Settings.TABLE_LAZY, 
            batchSize:          Settings.TABLE_LAZY_SIZE, 
            batchIntervalSize:  Settings.TABLE_LAZY_LOAD_ITEMS,
            batchIntervalTime:  Settings.TABLE_LAZY_LOAD_TIME 
        });
        this.post_process();
    },

    post_process: function() {
        if (this.workspace.query.get('type') == 'QM' && Settings.MODE != "view") {
            $(this.el).addClass('headerhighlight');
        } else {
            $(this.el).removeClass('headerhighlight');
        }
        /*
        var tipOptions = {
          delayIn: 200,
          delayOut:80,
          offset:  2,
          html:    true,
          gravity: "nw",
          fade:    false,
          followMouse: true,
          corners: true,
          arrow:   false,
          opacity: 1
    };

        $(this.el).find('th.row, th.col').tipsy(tipOptions);
        */
        $(this.el).find(".i18n").i18n(Saiku.i18n.po_file);
        this.workspace.trigger('table:rendered', this);
        this.workspace.trigger('report:rendered', this);

    }
});
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
 * The analysis workspace
 */
var Workspace = Backbone.View.extend({
    className: 'tab_container',

    events: {
        'click .sidebar_separator': 'toggle_sidebar',
        'change .cubes': 'new_query',
        'drop .sidebar': 'remove_dimension',
        'drop .workspace_results': 'remove_dimension',
        'click .refresh_cubes' : 'refresh',
        'click .cancel' : 'cancel',
        'click .admin' : 'admin'
    },

    initialize: function(args) {
        // Maintain `this` in jQuery event handlers
        _.bindAll(this, "caption", "adjust", "toggle_sidebar", "prepare", "new_query", "set_class_charteditor",
                "init_query", "update_caption", "populate_selections","refresh", "sync_query", "cancel", "cancelled", "no_results", "error", "switch_view_state");

        // Attach an event bus to the workspace
        _.extend(this, Backbone.Events);
        this.loaded = false;
        this.bind('query:result',this.render_result);

        // Generate toolbar and append to workspace
        this.toolbar = new WorkspaceToolbar({ workspace: this });
        this.toolbar.render();

        this.upgrade = new Upgrade({ workspace: this});
        this.upgrade.render();

        this.querytoolbar = new QueryToolbar({ workspace: this });
        this.querytoolbar.render();

        // Create drop zones
        this.drop_zones = new WorkspaceDropZone({ workspace: this });
        this.drop_zones.render();

        // Generate table
        this.table = new Table({ workspace: this });

        this.chart = new Chart({ workspace: this });

        // Create instance for Date Filter
        this.dateFilter = new DateFilterCollection();

        // Pull query from args
        this.item = {};
        this.viewState = (args && args.viewState) ? args.viewState : Settings.DEFAULT_VIEW_STATE; // view / edit
        this.isReadOnly = (Settings.MODE == 'view' || false);
        if (args && args.item) {
            this.item = args.item;
            if (this.item && this.item.hasOwnProperty('acl') && _.indexOf(this.item.acl, "WRITE") <  0) {
                this.isReadOnly = true;
                this.viewState = 'view';
            }
        }
        if (!args || (!args.query && !args.viewState)) {
            this.viewState = 'edit';
        }
        if (args && args.query) {
            this.query = args.query;
            this.query.workspace = this;
            this.query.save({}, { success: this.init_query , error: function() {
                Saiku.ui.unblock();
                if ( $('body').find('.error_loading_query').length < 1) {
                    var message = (Saiku.i18n && Saiku.i18n.po_file.error_loading_query) ? Saiku.i18n.po_file.error_loading_query : null;
                    if (!message) {
                        message = "Error Loading Query";
                        $('<span class="i18n error_loading_query">' + message + '</span>').hide().appendTo('body');
                        Saiku.i18n.translate();
                        message = $('.error_loading_query').text();
                    }
                    alert(message);

                } else {
                    var m = $('.error_loading_query').text();
                    alert(m);
                }
            }});
        }

        // Flash cube navigation when rendered
        Saiku.session.bind('tab:add', this.prepare);

        // Selected schema and cube via url
        var paramsURI = Saiku.URLParams.paramsURI();
        if(args!=undefined && args.processURI != undefined && args.processURI==false){
            paramsURI = {};
        }
        if (Saiku.URLParams.equals({ schema: paramsURI.schema, cube: paramsURI.cube })) {
            this.data_connections(paramsURI);
        }
        else {
            this.data_connections(paramsURI);
        }
    },
    afterRender: function () {
        console.log("After render");
    },
    caption: function(increment) {
        if (this.query && this.query.model) {
            if (this.item && this.item.name) {
                return this.item.name.split('.')[0];
            } else if (this.query.model.mdx) {
                return this.query.model.name;
            }
        } else if (this.query && this.query.get('name')) {
            return this.query.get('name');
        }
        if (increment) {
            Saiku.tabs.queryCount++;
        }
        return "<span class='i18n'>Unsaved query</span> (" + (Saiku.tabs.queryCount) + ")";
    },

    selected_cube_template: function(selectedCube) {
        var connections = Saiku.session.sessionworkspace;
        connections.selected = selectedCube;
        return _.template(
            '<select class="cubes">' +
                '<option value="" class="i18n">Select a cube</option>' +
                '<% _.each(connections, function(connection) { %>' +
                    '<% _.each(connection.catalogs, function(catalog) { %>' +
                        '<% _.each(catalog.schemas, function(schema) { %>' +
                            '<% if (schema.cubes.length > 0) { %>' +
                                '<optgroup label="<%= (schema.name !== "" ? schema.name : catalog.name) %> <%= (connection.name) %>">' +
                                    '<% _.each(schema.cubes, function(cube) { %>' +
                                        '<% if ((typeof cube["visible"] === "undefined" || cube["visible"]) && selected !== cube.caption) { %>' +
                                            '<option value="<%= connection.name %>/<%= catalog.name %>/<%= ((schema.name === "" || schema.name === null) ? "null" : schema.name) %>/<%= encodeURIComponent(cube.name) %>"><%= ((cube.caption === "" || cube.caption === null) ? cube.name : cube.caption) %></option>' +
                                        '<% } else if ((typeof cube["visible"] === "undefined" || cube["visible"]) && selected === cube.caption) { %>' +
                                            '<option value="<%= connection.name %>/<%= catalog.name %>/<%= ((schema.name === "" || schema.name === null) ? "null" : schema.name) %>/<%= encodeURIComponent(cube.name) %>" selected><%= ((cube.caption === "" || cube.caption === null) ? cube.name : cube.caption) %></option>' +
                                        '<% } %>' +
                                    '<% }); %>' +
                                '</optgroup>' +
                            '<% } %>' +
                        '<% }); %>' +
                    '<% }); %>' +
                '<% }); %>' +
            '</select>'
        )(connections);
    },

    template: function() {
        var template = $("#template-workspace").html() || "",
            htmlCubeNavigation = false,
            selectedCube;

        if (this.isUrlCubeNavigation) {
            selectedCube = this.selected_cube.split('/')[3],
            htmlCubeNavigation = this.selected_cube_template(selectedCube);
        }

        return _.template(template)({
            cube_navigation: htmlCubeNavigation
                ? htmlCubeNavigation
                : Saiku.session.sessionworkspace.cube_navigation
        });
    },

    refresh: function(e) {
        if (e) { e.preventDefault(); }
        Saiku.session.sessionworkspace.refresh();
    },

    render: function() {
        // Load template
        var self = this;
        $(this.el).html(this.template());

        this.processing = $(this.el).find('.query_processing');

        if (this.isReadOnly || Settings.MODE && (Settings.MODE == "view" || Settings.MODE == "table" || Settings.MODE == "map" || Settings.MODE == "chart")) {
            $(this.el).find('.workspace_editor').remove();
            this.toggle_sidebar();
            $(this.el).find('.sidebar_separator').remove();
            $(this.el).find('.workspace_inner')
                .css({ 'margin-left': 0 });
            $(this.el).find('.workspace_fields').remove();
            $(this.el).find('.sidebar').hide();

            $(this.toolbar.el)
                .find(".run, .auto, .toggle_fields, .toggle_sidebar,.switch_to_mdx, .new")
                .parent().remove();

        } else {

            // Show drop zones

            $(this.el).find('.workspace_editor').append($(this.drop_zones.el));
            // Activate sidebar for removing elements
            $(this.el).find('.sidebar')
                .droppable({
                    accept: '.d_measure, .selection'
                });

            $(this.el).find('.workspace_results')
                .droppable({
                    accept: '.d_measure, .selection'
                });
        }

        if (Settings.MODE && (Settings.MODE == "table" || Settings.MODE == "chart" || Settings.MODE == "map")) {
            $(this.el).find('.workspace_toolbar').remove();
            $(this.el).find('.query_toolbar').remove();
        } else {
            // Show toolbar
            $(this.el).find('.workspace_toolbar').append($(this.toolbar.el));
            $(this.el).find('.query_toolbar').append($(this.querytoolbar.el));
            $(self.el).find('.upgrade').append($(self.upgrade.el));


        }

        this.switch_view_state(this.viewState, true);


        // Add results table
        $(this.el).find('.workspace_results')
            .append($(this.table.el));

        this.chart.render_view();
        // Adjust tab when selected
        this.tab.bind('tab:select', this.adjust);
        $(window).resize(this.adjust);


        // Fire off new workspace event
        Saiku.session.trigger('workspace:new', { workspace: this });

        if (Settings.PLUGIN && Settings.BIPLUGIN5 == false && Saiku.session.isAdmin) {
            var $link = $('<a />')
                .attr({
                    href: '#adminconsole',
                    title: 'Admin Console'
                })
                .click(Saiku.AdminConsole.show_admin)
                .addClass('button admin_console');
            $(this.el).find('.refresh_cubes_nav').css('margin-right', '40px');
            $(this.el).find('.admin_console_nav').append($link);
        }
        
        if (!Saiku.session.isAdmin) {
            $(this.el).find('.refresh_cubes_nav').hide();
        }

        return this;
    },

    clear: function() {
        // Prepare the workspace for a new query
        this.table.clearOut();
        $(this.el).find('.workspace_results table,.connectable')
            .html('');
        $(this.el).find('.workspace_results_info').empty();
        $(this.el).find('.parameter_input').empty();
        $(this.chart.el).find('div.canvas').empty();
        $(this.querytoolbar.el).find('ul.options a.on').removeClass('on');
        $(this.el).find('.fields_list[title="ROWS"] .limit').removeClass('on');
        $(this.el).find('.fields_list[title="COLUMNS"] .limit').removeClass('on');
        // Trigger clear event
        Saiku.session.trigger('workspace:clear', { workspace: this });

    },

    adjust: function() {
        // Adjust the height of the separator
        var $separator = $(this.el).find('.sidebar_separator');
        var heightReduction = 87;
        if (Settings.PLUGIN === true || Settings.BIPLUGIN === true) {
            heightReduction = 2;
            if (Settings.MODE == 'table') {
                heightReduction = -5;
            }
        }
        if ($('#header').length === 0 || $('#header').is('hidden')) {
            heightReduction = 2;
        }

        $separator.height($("body").height() - heightReduction);
        $(this.el).find('.sidebar').height($("body").height() - heightReduction);

        $(this.querytoolbar.el).find('div').height($("body").height() - heightReduction - 10);

        // Adjust the dimensions of the results window
        var editorHeight = $(this.el).find('.workspace_editor').is(':hidden') ? 0 : $(this.el).find('.workspace_editor').height();
        var processingHeight = $(this.el).find('.query_processing').is(':hidden') ? 0 : $(this.el).find('.query_processing').height() + 62;
        var upgradeHeight = $(this.el).find('.upgradeheader').is(':hidden') ? 0 : $(this.el).find('.upgrade').height();

        $(this.el).find('.workspace_results').css({
            height: $("body").height() - heightReduction -
                $(this.el).find('.workspace_toolbar').height() -
                $(this.el).find('.workspace_results_info').height() -
                editorHeight - processingHeight - upgradeHeight - 20
        });

        if (this.querytoolbar) { $(this.querytoolbar.el).find('a').tipsy({ delayIn: 700, fade: true}); }
        if (this.toolbar) { $(this.toolbar.el).find('a').tipsy({ delayIn: 900, fade: true}); }
        $(this.el).find('.workspace_fields').css({height: $("body").height()- heightReduction-
        $(this.el).find('.workspace_toolbar').height() -
        upgradeHeight - 20});

        // Fire off the adjust event
        this.trigger('workspace:adjust', { workspace: this });
    },

    toggle_sidebar: function() {
        // Toggle sidebar
        $(this.el).find('.sidebar').toggleClass('hide');
        $(this.toolbar.el).find('.toggle_sidebar').toggleClass('on');
        var calculatedMargin =
                ($(this.el).find('.sidebar').is(':visible') ? $(this.el).find('.sidebar').width() : 0) +
                ($(this.el).find('.sidebar_separator').width()) +
                1;
        var new_margin = calculatedMargin;
        $(this.el).find('.workspace_inner').css({ 'margin-left': new_margin });
    },

    prepare: function() {
        // Draw user's attention to cube navigation
        /*$(this.el).find('.cubes')
            .parent()
            .css({ backgroundColor: '#AC1614' })
            .delay(300)
            .animate({ backgroundColor: '#fff' }, 'slow');*/
    },
   setDefaultFilters: function(filters, query){

        _.each(filters, function(f){

            var n = f.filtername;

            var hierarchy = n.substring(0, n.lastIndexOf("[")-1);
            var level = n.substring(n.lastIndexOf("["));

            query.helper.setDefaultFilter(hierarchy, level, f.filtervalue)
        });


    },
    data_connections: function(paramsURI) {
        var connections = Saiku.session.sessionworkspace.connections,
            self = this;
        _.each(connections, function(connection) {
            _.each(connection.catalogs, function(catalog) {
                _.each(catalog.schemas, function(schema) {
                    if (schema.cubes.length > 0) {
                        _.each(schema.cubes, function(cube) {
                            if (typeof cube['visible'] === 'undefined' || cube['visible']) {
                                var schemaName = ((schema.name === '' || schema.name === null) ? 'null' : schema.name),
                                    cubeName = ((cube.caption === '' || cube.caption === null) ? cube.name : cube.caption);
                                if (paramsURI.schema === schemaName && paramsURI.cube === cubeName) {
                                    self.selected_cube = connection.name + '/' + catalog.name + '/' + schemaName + '/' + cubeName;
                                    self.isUrlCubeNavigation = true;
                                    self.paramsURI = paramsURI;
                                    _.delay(self.new_query, 1000);
                                }
                            }
                        });
                    }
                });
            });
        });
    },
    create_new_query: function(obj){
        if (obj.query) {
            obj.query.destroy();
            obj.query.clear();
            if (obj.query.name) {
                obj.query.name = undefined;
                obj.update_caption(true);
            }
            obj.query.name = undefined;
        }
        obj.clear();
        obj.processing.hide();
        Saiku.session.trigger('workspace:clear', { workspace: obj });

        // Initialize the new query
        obj.selected_cube = $(obj.el).find('.cubes').val()
            ? $(obj.el).find('.cubes').val()
            : obj.selected_cube;
        if (!obj.selected_cube) {
            // Someone literally selected "Select a cube"
            $(obj.el).find('.calculated_measures, .addMeasure').hide();
            $(obj.el).find('.dimension_tree').html('');
            $(obj.el).find('.measure_tree').html('');
            return false;
        }
        obj.metadata = Saiku.session.sessionworkspace.cube[obj.selected_cube];
        var parsed_cube = obj.selected_cube.split('/');
        var cube = parsed_cube[3];
        for (var i = 4, len = parsed_cube.length; i < len; i++) {
            cube += "/" + parsed_cube[i];
        }
        Saiku.events.trigger("workspace:new_query", this, {view: this, cube: cube});

        this.query = new Query({
            cube: {
                connection: parsed_cube[0],
                catalog: parsed_cube[1],
                schema: (parsed_cube[2] == "null" ? "" : parsed_cube[2]) ,
                name: decodeURIComponent(cube)
            }
        }, {
            workspace: obj
        });

        obj.query = this.query;

        var p = this.paramsURI;
        //var deffilters = this.extractDefaultFilters(p);
        //this.setDefaultFilters(deffilters, obj.query);

        // Save the query to the server and init the UI
        obj.query.save({},{ data: { json: JSON.stringify(this.query.model) }, async: false });
        obj.init_query();

    },

    extractDefaultFilters: function(p){
        var defaultfilters=[];
        var filtername;
        var filtervalue;
        for(var i in p){
            if(i.indexOf("default_filter_")>-1){
                var j = i.replace("default_filter_", "");
                filtername = j;
                filtervalue = p[i];
                defaultfilters.push({"filtername":j, "filtervalue":filtervalue});
            }

        }
        return defaultfilters;

    },

    new_query: function() {
        // Delete the existing query
        if (this.query) {
            if(Settings.QUERY_OVERWRITE_WARNING) {
                (new WarningModal({
                    title: "New Query", message: "You are about to clear your existing query",
                    okay: this.create_new_query, okayobj: this
                })).render().open();
            }
            else{
                this.create_new_query(this);
            }
        }
        else{
            this.create_new_query(this);
        }

    },

    init_query: function(isNew) {
        var self = this;
        try
        {

            // TODO: This should be refactored, the workspace should have a renderer set and always use that
            // probably extend the Table.js with TableRenderer and make it an advanced one

            var properties = this.query.model.properties ? this.query.model.properties : {} ;

            var renderMode =  ('RENDER_MODE' in Settings) ? Settings.RENDER_MODE
                                    : ('saiku.ui.render.mode' in properties) ? properties['saiku.ui.render.mode']
                                    : null;
            var renderType =  ('RENDER_TYPE' in Settings) ? Settings.RENDER_TYPE
                                    : ('saiku.ui.render.type' in properties) ? properties['saiku.ui.render.type']
                                    : null;

        if(Settings.MODE == "table"){
        renderMode= "table";
        }
        else if(Settings.MODE == "chart"){
        renderMode="chart";
        }
        else if(Settings.MODE == "map"){
        renderMode="map";
        }
            if (typeof renderMode != "undefined" && renderMode !== null) {
                this.querytoolbar.switch_render(renderMode);
            }

            if ('chart' == renderMode) {
                if (Settings.MODE && Settings.MODE === 'chart' && (renderType === 'map_heat' || renderType === 'map_geo' || renderType === 'map_marker')) {
                    this.query.setProperty('saiku.ui.render.mode', 'chart');
                    renderType = 'stackedBar';
                }
                $(this.chart.el).find('.canvas_wrapper').hide();
                this.chart.renderer.switch_chart(renderType);
                $(this.querytoolbar.el).find('ul.chart [href="#' + renderType+ '"]').parent().siblings().find('.on').removeClass('on');
                $(this.querytoolbar.el).find('ul.chart [href="#' + renderType+ '"]').addClass('on');
                this.set_class_charteditor();
            } else if ('table' == renderMode && renderType in this.querytoolbar) {
                this.querytoolbar.render_mode = "table";
                this.querytoolbar.spark_mode = renderType;
                $(this.querytoolbar.el).find('ul.table a.' + renderType).addClass('on');
            }
            else if (renderMode === 'map') {
                this.querytoolbar.$el.find('ul.chart > li').find('a').removeClass('on');
                this.querytoolbar.$el.find('ul.chart [href="#' + renderMode + '"]').addClass('on');
            }
        } catch (e) {
                Saiku.error(this.cid, e);
        }

        if ((Settings.MODE == "table") && this.query) {
            this.query.run(true);
            return;
        }

        if (this.query.model.type == "MDX") {
                this.query.setProperty("saiku.olap.result.formatter", "flat");
            if (! $(this.el).find('.sidebar').hasClass('hide')) {
                this.toggle_sidebar();
            }
            $(this.el).find('.workspace_fields').addClass('hide');
            this.toolbar.switch_to_mdx();
        } else {
            $(this.el).find('.workspace_editor').removeClass('hide').show();
            $(this.el).find('.workspace_fields').removeClass('disabled').removeClass('hide');
            $(this.el).find('.workspace_editor .mdx_input').addClass('hide');
            $(this.el).find('.workspace_editor .editor_info').addClass('hide');
            $(this.toolbar.el).find('.auto, .toggle_fields, .query_scenario, .buckets, .non_empty, .swap_axis, .mdx, .switch_to_mdx, .zoom_mode, .drillacross').parent().show();
            $(this.el).find('.run').attr('href','#run_query');
        }
        this.adjust();
        this.switch_view_state(this.viewState, true);

        if (!$(this.el).find('.sidebar').hasClass('hide') && (Settings.MODE == "chart" || Settings.MODE == "table" || Settings.MODE == "map" || Settings.MODE == "view" || this.isReadOnly)) {
                this.toggle_sidebar();
        }
        if ((Settings.MODE == "view") && this.query || this.isReadOnly) {
            this.query.run(true);
            if (this.selected_cube === undefined) {
                var schema = this.query.model.cube.schema;
                this.selected_cube = this.query.model.cube.connection + "/" +
                    this.query.model.cube.catalog + "/" +
                    ((schema === "" || schema === null) ? "null" : schema) +
                    "/" + encodeURIComponent(this.query.model.cube.name);
                $(this.el).find('.cubes')
                    .val(this.selected_cube);
            }
            return;
        }


        // Find the selected cube
        if (this.selected_cube === undefined) {
            var schema = this.query.model.cube.schema;
            this.selected_cube = this.query.model.cube.connection + "/" +
                this.query.model.cube.catalog + "/" +
                ((schema === "" || schema === null) ? "null" : schema) +
                "/" + encodeURIComponent(this.query.model.cube.name);
            $(this.el).find('.cubes')
                .val(this.selected_cube);
        }

        if (this.selected_cube) {
            // Create new DimensionList and MeasureList
            var cubeModel = Saiku.session.sessionworkspace.cube[this.selected_cube];

            this.dimension_list = new DimensionList({
                workspace: this,
                cube: cubeModel
            });
            this.dimension_list.render();

            $(this.el).find('.metadata_attribute_wrapper').html('').append($(this.dimension_list.el));

            if (!cubeModel.has('data')) {
                cubeModel.fetch({ success: function() {
                    self.trigger('cube:loaded');
                }});
            }
            this.trigger('query:new', { workspace: this });

        } else {
            // Someone literally selected "Select a cube"
            $(this.el).find('.calculated_measures, .addMeasure').hide();
            $(this.el).find('.dimension_tree').html('');
            $(this.el).find('.measure_tree').html('');
        }

        // is this a new query?
        if (typeof isNew != "undefined") {
            this.query.run(true);
        }
        Saiku.i18n.translate();


    },
    
    set_class_charteditor: function() {
        var chartOptions = this.query.getProperty('saiku.ui.chart.options');
        if (chartOptions) {
            $(this.querytoolbar.el).find('ul.chart [href="#charteditor"]').addClass('on');
        }
    },

    synchronize_query: function() {
        var self = this;
        if (!self.isReadOnly && (!Settings.hasOwnProperty('MODE') || (Settings.MODE != "table" && Settings.MODE != "view"))) {


        }



    },

    sync_query: function(dimension_el) {

        var model = this.query.helper.model();
        if (model.type === "QUERYMODEL") {

            var self = this;
            var dimlist = dimension_el ? dimension_el : $(self.dimension_list.el);

            if (!self.isReadOnly && (!Settings.hasOwnProperty('MODE') || (Settings.MODE != "table" && Settings.MODE != "view"))) {
                dimlist.find('.selected').removeClass('selected');

                var calcMeasures = self.query.helper.getCalculatedMeasures();
                //var calcMembers = self.query.helper.getCalculatedMembers();

                if (calcMeasures && calcMeasures.length > 0) {
                    var template = _.template($("#template-calculated-measures").html(),{ measures: calcMeasures });
                    dimlist.find('.calculated_measures').html(template);
                    dimlist.find('.calculated_measures').find('.measure').parent('li').draggable({
                        cancel: '.not-draggable',
                        connectToSortable: $(self.el).find('.fields_list_body.details ul.connectable'),
                        helper: 'clone',
                        placeholder: 'placeholder',
                        opacity: 0.60,
                        tolerance: 'touch',
                        containment:    $(self.el),
                        cursorAt: { top: 10, left: 35 }
                    });
                }
                else {
                    dimlist.find('.calculated_measures').empty();
                }

                /*if (calcMembers && calcMembers.length > 0) {
                    var self = this;
                    var $dimensionTree = dimlist.find('.dimension_tree').find('.parent_dimension').find('.d_hierarchy');
                    var len = calcMembers.length;
                    var templateLevelMember;
                    var i;

                    $dimensionTree.find('.dimension-level-calcmember').remove();

                    for (i = 0; i < len; i++) {
                        $dimensionTree.each(function(key, value) {
                            if ($(value).attr('hierarchy') === calcMembers[i].hierarchyName) {

                                templateLevelMember = _.template($('#template-calculated-member').html(), { member: calcMembers[i] });

                                if(!($(value).closest('.parent_dimension').find('span.root').hasClass('collapsed'))) {
                                    templateLevelMember = $(templateLevelMember).show();
                                }
                                else {
                                    templateLevelMember = $(templateLevelMember).hide();
                                }

                                $(value).append(templateLevelMember);

                                $(value).find('.level-calcmember').parent('li').draggable({
                                    cancel: '.not-draggable, .hierarchy',
                                    connectToSortable: $(self.el).find('.fields_list_body.columns > ul.connectable, .fields_list_body.rows > ul.connectable, .fields_list_body.filter > ul.connectable'),
                                    containment: $(self.el),
                                    helper: function(event, ui) {
                                        var target = $(event.target).hasClass('d_level') ? $(event.target) : $(event.target).parent();
                                        var hierarchy = target.find('a').attr('hierarchy');
                                        var level = target.find('a').attr('level');
                                        var h = target.parent().clone().removeClass('d_hierarchy').addClass('hierarchy');
                                        h.find('li a[hierarchy="' + hierarchy + '"]').parent().hide();
                                        h.find('li a[level="' + level + '"]').parent().show();
                                        var selection = $('<li class="selection selection-calcmember"></li>');
                                        selection.append(h);
                                        return selection;
                                    },
                                    placeholder: 'placeholder',
                                    opacity: 0.60,
                                    tolerance: 'touch',
                                    cursorAt: {
                                        top: 10,
                                        left: 85
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    dimlist.find('.dimension_tree').find('.parent_dimension').find('.d_hierarchy').find('.dimension-level-calcmember').remove();
                }*/

                self.drop_zones.synchronize_query();

            }
        }
        Saiku.i18n.translate();
    },

    /*jshint -W027*/
    /*jshint -W083*/
    populate_selections: function(dimlist) {
        var self = this;

        console.log('populate_selections');
        dimlist.workspace.sync_query();
        return false;

        if (this.other_dimension) {
        // Populate selections - trust me, this is prettier than it was :-/
        var axes = this.query ? this.query.get('axes') : false;
        if (axes) {
            for (var axis_iter = 0, axis_iter_len = axes.length; axis_iter < axis_iter_len; axis_iter++) {
                var axis = axes[axis_iter];
                var $axis = $(this.el).find('.' +
                    axis.name.toLowerCase() + ' ul');
                if ((axis.filterCondition !== null) ||
                        (axis.limitFunction && axis.limitFunction !== null && axis.limitFunction !== "") ||
                        (axis.sortOrder !== null))
                {
                    $axis.parent().siblings('.fields_list_header').addClass('on');
                }
                for (var dim_iter = 0, dim_iter_len = axis.dimensionSelections.length; dim_iter < dim_iter_len; dim_iter++) {
                    var dimension = axis.dimensionSelections[dim_iter];
                    var levels = [];
                    var members = {};

                    if (dimension.name != "Measures" && dimension.selections.length > 0) {
                        var ds = Saiku.session.sessionworkspace.cube[this.selected_cube].get('data').dimensions;
                        var h = dimension.selections[0].hierarchyUniqueName;
                        _.each(ds, function(d) {
                            if (dimension.name == d.name) {
                                _.each(d.hierarchies, function(hierarchy) {
                                    if (hierarchy.uniqueName == h) {
                                        var levels = [];
                                        _.each(hierarchy.levels, function(level) {
                                            levels.push(level.uniqueName);
                                        });
                                        dimension.selections = _.sortBy(dimension.selections, function(selection) {
                                            return _.indexOf(levels, selection.levelUniqueName);
                                        });
                                    }
                                });
                            }
                        });
                    } else if (dimension.name == "Measures" && dimension.selections.length > 0) {
                        var ms = Saiku.session.sessionworkspace.cube[this.selected_cube].get('data').measures;
                        var mlist = [];
                        _.each(ms, function(m) {
                            mlist.push(m.uniqueName);
                        });
                        dimension.selections = _.sortBy(dimension.selections, function(selection) {
                            return _.indexOf(mlist, selection.uniqueName);
                        });
                    }


                    for (var sel_iter = 0, sel_iter_len = dimension.selections.length; sel_iter < sel_iter_len; sel_iter++) {
                        var selection = dimension.selections[sel_iter];

                        // Drag over dimensions and measures
                        var type, name;
                        if (selection.dimensionUniqueName == "Measures") {
                            type = "measure";
                            name = selection.uniqueName;
                        } else {
                            type = "dimension";
                            name = selection.levelUniqueName;
                        }

                        if (levels.indexOf(name) === -1) {

                            var $dim = $('');

                            if (typeof dimension_el != "undefined" && (!$dim.html() || $dim.html() === null)) {
                                $dim = $(dimension_el)
                                .find('a[rel="' + name + '"]')
                                .parent();
                            }
/*
                            if (typeof self.measure_list != "undefined" && (!$dim.html() || $dim.html() == null)) {
                                $dim = $(self.measure_list.el)
                                .find('a[rel="' + name + '"]')
                                .parent();
                            }
*/
                            if (typeof self.dimension_list != "undefined" && (!$dim.html() || $dim.html() === null)) {
                                $dim = $(self.dimension_list.el)
                                .find('a[rel="' + name + '"]')
                                .parent();
                            }


                            var $clone = $dim.clone()
                                .addClass('d_' + type)
                                .appendTo($axis);

                            var sort;

                            if (type == "dimension") {
                                $("<span />").addClass('sprite selections')
                                    .prependTo($clone);
                                $icon = $("<span />").addClass('sort');
                                sort = false;
                                _.each(axes, function(i_axis) {
                                    if (i_axis.sortLiteral && i_axis.sortLiteral !== null && i_axis.sortLiteral.indexOf(selection.hierarchyUniqueName) != -1) {
                                        $icon.addClass(i_axis.sortOrder);
                                        sort = true;
                                    }
                                });
                                if (!sort) {
                                    $icon.addClass('none');
                                }

                                $icon.insertBefore($clone.find('span'));
                            }

                            if (type == "measure") {
                                $icon = $("<span />").addClass('sort');
                                sort = false;
                                _.each(axes, function(i_axis) {
                                    if (i_axis.sortLiteral && i_axis.sortLiteral !== null && i_axis.sortLiteral.indexOf(name) != -1) {
                                        $icon.addClass(i_axis.sortOrder);
                                        sort = true;
                                    }
                                });
                                if (!sort) {
                                    $icon.addClass('none');
                                }

                                $icon.insertBefore($clone.find('a'));
                            }



                            $dim.css({fontWeight: "bold"})
                                .draggable('disable')
                                .parents('.parent_dimension')
                                .find('.folder_collapsed')
                                .css({fontWeight: "bold"});
                            levels.push(name);
                        }

                        // FIXME - something needs to be done about selections here
                    }
                }
            }
        }

        // Make sure appropriate workspace buttons are enabled
        this.trigger('query:new', { workspace: this });

        // Update caption when saved
        this.query.bind('query:save', this.update_caption);
        } else {
            this.other_dimension = dimension_el;
        }

    },

    update_caption: function(increment) {
        var caption = this.caption(increment);
        this.tab.set_caption(caption);
    },



    remove_dimension: function(event, ui) {
        if (this.query.model.type == "QUERYMODEL") {
                this.drop_zones.remove_dimension(event, ui);
        }
    },

    update_parameters: function () {
        var self = this;
        $(this.el).find('.parameter_input').html("");
        if (!self.hasOwnProperty('query') || !Settings.ALLOW_PARAMETERS || Settings.MODE === "view" || self.viewState === 'view')
            return;

        var paramDiv = "<span class='i18n'>Parameters</span>: ";
        var parameters = this.query.helper.model().parameters;
        var hasParams = false;
        for (var key in parameters) {
            var val = "";
            var comparison;
            if (parameters[key] && parameters[key] !== null) {
                val = parameters[key];
                comparison = parameters[key].split(",");
            }

            if (val != undefined && val != "") {
                val = val + ",";
            }
            var selections = this.query.helper.getSelectionsForParameter(key);
            _.each(selections, function (s) {
                var found = $.inArray(s.name, comparison) > -1;
                if (!found) {
                    val = val + s.name + ",";
                }
            });

            val = val.substr(0, val.lastIndexOf(","));

            paramDiv += "<b>" + key + "</b> <input type='text' placeholder='" + key + "' value='" + val + "' />";
            hasParams = true;

            var values = val.split(",")

            var level = self.query.helper.getLevelForParameter(key);
            _.each(values, function (v) {
                if(v!=undefined && v!="") {
                    self.query.helper.addtoSelection(v, level)
                }
            })
        }
        paramDiv += "";

        if (hasParams) {
            $(this.el).find('.parameter_input').html(paramDiv);
        } else {
            $(this.el).find('.parameter_input').html("");
        }

        $(this.el).find('.parameter_input input').off('change');
        $(this.el).find('.parameter_input input').on('change', function (event) {
            var paramName = $(event.target).attr('placeholder');
            var paramVal = $(event.target).val();
            self.query.helper.model().parameters[paramName] = paramVal;
        });


    }
    ,

    render_result: function(args) {
        var self = this;
        $(this.el).find(".workspace_results_info").empty();

        if (args.data !== null && args.data.error !== null) {
            return this.error(args);
        }
        // Check to see if there is data
        if (args.data === null || (args.data.cellset && args.data.cellset.length === 0)) {
            return this.no_results(args);
        }

        var chour = new Date().getHours();
        if (chour < 10) chour = "0" + chour;

        var cminutes = new Date().getMinutes();
        if (cminutes < 10) cminutes = "0" + cminutes;

        var cdate = chour + ":" + cminutes;
        var runtime = args.data.runtime !== null ? (args.data.runtime / 1000).toFixed(2) : "";
        /*
        var info = '<b>Time:</b> ' + cdate
                + " &emsp;<b>Rows:</b> " + args.data.height
                + " &emsp;<b>Columns:</b> " + args.data.width
                + " &emsp;<b>Duration:</b> " + runtime + "s";
        */
        var info = '<b><span class="i18n">Info:</span></b> &nbsp;' + cdate +
                   "&emsp;/ &nbsp;" + args.data.width +
                   " x " + args.data.height +
                   "&nbsp; / &nbsp;" + runtime + "s";


        this.update_parameters();

        $(this.el).find(".workspace_results_info").html(info);

        var h = args.workspace.query.getProperty("saiku.ui.headings");
        if(h!=undefined) {
            var headings = JSON.parse(h);
            var header = '';
            if(headings.title!=null && headings.title != "") {
                header = '<h3><span class="i18n">Title:</span></h3> &nbsp;' + headings.title + '<br/>';
            }
            if(headings.variable != null && headings.variable != "") {
                header += '<h3><span class="i18n">Variable:</span></h3> &nbsp;' + headings.variable + '<br/>';
            }
            if(headings.explanation!=null && headings.explanation != "") {
                header += '<h3><span class="i18n">Explanation:</span></h3> &nbsp;' + headings.explanation;
            }
            $(this.el).find(".workspace_results_titles").html(header);
        }
        this.adjust();
        Saiku.i18n.translate();
        return;
    },

    switch_view_state: function(mode, dontAnimate) {
        var target = mode || 'edit';

        if (target == 'edit') {
                //$(this.el).find('.workspace_editor').show();
                this.toolbar.toggle_fields_action('show', dontAnimate);
                if (this.query && this.query.get('type') == "MDX") {
                    this.toolbar.editor.gotoLine(0);
                }
                if ($(this.el).find('.sidebar').hasClass('hide')) {
                    this.toggle_sidebar();
                }
                //$(this.el).find('.sidebar_separator').show();
                //$(this.el).find('.workspace_inner').removeAttr('style');
                $(this.toolbar.el).find(".auto, .toggle_fields, .toggle_sidebar,.switch_to_mdx, .new").parent().css({ "display" : "block" });
        } else if (target == 'view') {
                //$(this.el).find('.workspace_editor').hide();
                this.toolbar.toggle_fields_action('hide', dontAnimate);
                if (!$(this.el).find('.sidebar').hasClass('hide')) {
                    this.toggle_sidebar();
                }
                //$(this.el).find('.sidebar_separator').hide();
                //$(this.el).find('.workspace_inner').css({ 'margin-left': 0 });

                $(this.toolbar.el).find(".auto, .toggle_fields, .toggle_sidebar,.switch_to_mdx").parent().hide();
        }
        this.viewState = target;
        this.update_parameters();
        $(window).trigger('resize');

    },

    block: function(message) {
        var self = this;

        if(Settings.LOGO_32x32){
            $(self.el).block({
                message: '<img class="saiku_logo_override" style="float:left" src="'+Settings.LOGO_32x32+'"/> ' + message
            });
            Saiku.i18n.translate();
        }
        else{
            $(self.el).block({
                message: '<span class="saiku_logo" style="float:left">&nbsp;&nbsp;</span> ' + message
            });
            Saiku.i18n.translate();

        }
    },

    unblock: function() {
        if (isIE) {
            Saiku.ui.unblock();
        } else {
            $(this.el).unblock();
            Saiku.ui.unblock();
        }
    },

    cancel: function(event) {
        var self = this;
        if (event) {
            event.preventDefault();
        }
        this.query.action.del("/cancel", {
            success: function() {
                self.cancelled();
            }
        });
    },

    admin: function(event){
        Saiku.AdminConsole.show_admin();
    },

    cancelled: function(args) {
        this.processing.html('<span class="processing_image">&nbsp;&nbsp;</span> <span class="i18n">Canceling Query...</span>').show();
    },

    no_results: function(args) {
        this.processing.html('<span class="i18n">No Results</span>').show();
    },

    error: function(args) {
        this.processing.html(safe_tags_replace(args.data.error)).show();
    }
});
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
 * The delete query confirmation dialog
 */
var DeleteRepositoryObject = Modal.extend({
    type: "delete",
    
    buttons: [
        { text: "Yes", method: "del" },
        { text: "No", method: "close" }
    ],
    
    initialize: function(args) {
        this.options.title = "Confirm deletion";
        this.query = args.query;
        this.success = args.success;
        this.message = '<span class="i18n">Are you sure you want to delete </span>'+'<span>' + this.query.get('name') + '?</span>';
    },
    
    del: function() {
        this.query.set("id", _.uniqueId("query_"));
        this.query.id = _.uniqueId("query_");
        this.query.url = this.query.url() + "?file=" + encodeURIComponent(this.query.get('file'));
        this.query.destroy({
            success: this.success,
            dataType: "text",
            error: this.error,
            wait:true
        });
        this.close();
    },
    
    error: function() {
        $(this.el).find('dialog_body')
            .html('<span class="i18n">Could not delete repository object</span>');
    }
});
/*
 *   Copyright 2014 OSBI Ltd
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
 * The delete query confirmation dialog
 */
var MoveRepositoryObject = Modal.extend({
    type: "save",
    closeText: "Move",

    events: {
        'click': 'select_root_folder', /* select root folder */
        'click .dialog_footer a' : 'call',
        'click .query': 'select_name',
        'dblclick .query': 'open_query',
        'click li.folder': 'toggle_folder',
        'keyup .search_file' : 'search_file',
        'click .cancel_search' : 'cancel_search',
        'click .export_btn' : 'export_zip',
        'change .file' : 'select_file'
    },

    buttons: [
        { id: "test", text: "Move", method: "open_query" },
        { text: "Cancel", method: "close" }
    ],

    initialize: function(args) {
        // Append events
        var self = this;
        var name = "";
        this.movefolder = args.query;
        this.success = args.success;

        this.message =  "<br/><b><div class='query_name'><span class='i18n'>Please select a folder.....</span></div></b><br/><div class='RepositoryObjects i18n'>Loading...</div>" +
            "<br>" +
            '<div style="height:25px; line-height:25px;"><b><span class="i18n">Search:</span></b> &nbsp;' +
            ' <span class="search"><input type="text" class="search_file"></input><span class="cancel_search"></span></span></div>';

        _.extend(this.options, {
            title: "Move"
        });

        this.selected_folder = null;

        // Initialize repository
        this.repository = new Repository({}, { dialog: this });

        this.bind( 'open', function( ) {
            var height = ( $( "body" ).height() / 2 ) + ( $( "body" ).height() / 6 );
            if( height > 420 ) {
                height = 420;
            }
            $(this.el).find('.RepositoryObjects').height( height );
            $(this.el).dialog( 'option', 'position', 'center' );
            $(this.el).parents('.ui-dialog').css({ width: "550px" });
            $(this.el).find('.dialog_footer').find('a[href="#open_query"]').hide();

            self.repository.fetch( );
        } );


        // Maintain `this`
        _.bindAll( this, "populate", "toggle_folder", "select_name", "select_file", "select_folder", "open_query");


    },
    populate: function( repository ) {
        var self = this;
        $( this.el ).find( '.RepositoryObjects' ).html(
            _.template( $( '#template-repository-objects' ).html( ) )( {
                repoObjects: repository
            } )
        );

        self.queries = {};
        function getQueries( entries ) {
            _.forEach( entries, function( entry ) {
                if(entry.type === 'FOLDER') {
                    self.queries[ entry.path ] = entry;
                //}
                //if( entry.type === 'FOLDER' ) {
                    getQueries( entry.repoObjects );
                }
            } );
        }
        getQueries( repository );
    },

    select_root_folder: function( event ) {
        var isNameInputField = $( event.target ).attr( 'name' ) === 'name';
        if( !isNameInputField ) {
            this.unselect_current_selected_folder( );
        }
    },
    toggle_folder: function( event ) {
        var $target = $( event.currentTarget );
        this.unselect_current_selected_folder( );
        $target.children('.folder_row').addClass( 'selected' );
        var $queries = $target.children( '.folder_content' );
        var isClosed = $target.children( '.folder_row' ).find('.sprite').hasClass( 'collapsed' );
        if( isClosed ) {
            $target.children( '.folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $queries.removeClass( 'hide' );
        } else {
            $target.children( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
            $queries.addClass( 'hide' );
        }

        this.select_folder();
        this.select_name(event);
        return false;
    },

    select_name: function( event ) {
        var $currentTarget = $( event.currentTarget );
        this.unselect_current_selected_folder( );
        $currentTarget.parent( ).parent( ).has( '.folder' ).children('.folder_row').addClass( 'selected' );
        var name = $currentTarget.find( 'a' ).attr('href');
        name = name.replace('#','');
        $(this.el).find('.query_name').html( name );
        $(this.el).find('.dialog_footer').find('a[href="#open_query"]').show();
        this.select_folder();
        return false;
    },

    unselect_current_selected_folder: function( ) {
        $( this.el ).find( '.selected' ).removeClass( 'selected' );
    },
    select_folder: function() {
        var foldersSelected = $( this.el ).find( '.selected' );
        var file = foldersSelected.length > 0 ? foldersSelected.children('a').attr('href').replace('#','') : null;
        if (typeof file != "undefined" && file !== null && file !== "") {
            var form = $('#importForm');
            form.find('.directory').val(file);
            var url = Settings.REST_URL + (new RepositoryZipExport()).url() + "upload";
            form.attr('action', url);
            $(this.el).find('.zip_folder').text(file);
            this.selected_folder = file;
            $(this.el).find('.export_btn, .import_btn').removeAttr('disabled');
            this.select_file();
        } else {
            $(this.el).find('.import_btn, .export_btn').attr('disabled', 'true');
        }

    },

    select_file: function() {
        var form = $('#importForm');
        var filename = form.find('.file').val();
        if (typeof filename != "undefined" && filename !== "" && filename !== null && this.selected_folder !== null) {
            $(this.el).find('.import_btn').removeAttr('disabled');
        } else {
            $(this.el).find('.import_btn').attr('disabled', 'true');
        }
    },

    open_query: function(event) {
        // Save the name for future reference
        var $currentTarget = $( event.currentTarget );
        var file = $(this.el).find('.query_name').html();
        if ($currentTarget.hasClass('query')) {
            file = $currentTarget.find( 'a' ).attr('href').replace('#','');
        }

        var that= this;
        var picture_entity = new MoveObject;
        picture_entity.save({source: this.movefolder.get("file"), target: file}, {success: function(){
            that.close();
            that.success();
        }});


        event.preventDefault();
        return false;
    }




});

var MoveObject = Backbone.Model.extend({
    url: function(){
    return "api/repository/resource/move";
}
});/*
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
 * The open query tab (Repository viewer)
 */
var OpenQuery = Backbone.View.extend({
    className: 'tab_container',

    events: {
        'click .query': 'view_query',
        'dblclick .query': 'select_and_open_query',
        'click .add_folder' : 'add_folder',
        'click li.folder': 'toggle_folder',
        'click .workspace_toolbar a.button' : 'prevent_default',
        'click .workspace_toolbar a.run': 'open_query',
        'click .workspace_toolbar a.edit': 'edit_query',
        'click .workspace_toolbar [href=#edit_folder]': 'edit_folder',
        'click .workspace_toolbar [href=#delete_folder]': 'delete_repoObject',
        'click .workspace_toolbar [href=#delete_query]': 'delete_repoObject',
        'click .workspace_toolbar [href=#edit_permissions]': 'edit_permissions',
        'click .queries' : 'click_canvas',
        'keyup .search_file' : 'search_file',
        'click .cancel_search' : 'cancel_search'
    },

    template: function() {
        return _.template($("#template-open-dialog").html())();
    },

    template_repository_objects: function( repository ) {
        var self = this;
        $(this.el).find('.sidebar ul').html(
            _.template( $( '#template-repository-objects' ).html( ) )( {
                repoObjects: repository
            } )
        );
    },

    caption: function() {
        return '<span class="i18n">Repository</span>';
    },

    /*jshint -W069 */
    render: function() {
        // Load template
        $(this.el).html(this.template());

        // Adjust tab when selected
        this.tab.bind('tab:select', this.fetch_queries);
        this.tab.bind('tab:select', this.adjust);
        $(window).resize(this.adjust);

        var self = this;
        var menuitems = {
                    "open": {name: "Open", i18n: true },
                    "edit": {name: "Edit", i18n: true },
//                    "rename": {name: "Rename", i18n: true },
                    "delete": {name: "Delete", i18n: true },
                    "move": {name: "Move", i18n: true},
                    "sep1": "---------",
                    "new": {name: "New Folder", i18n: true},
                    "opencontents": {name: "Open Folder Contents", i18n: true}
        };
        $.each(menuitems, function(key, item){
            recursive_menu_translate(item, Saiku.i18n.po_file);
        });

        $.contextMenu('destroy', 'li.query, div.folder_row');
        $.contextMenu({
                selector: 'li.query, div.folder_row',
                events: {
                    show: function(opt) {
                        $( self.el ).find( '.selected' ).removeClass( 'selected' );
                        $(this).addClass('selected');
                        var path = $(this).find('a').attr('href').replace('#', '');
                        var item = self.queries[path];

                        if (typeof item.acl != "undefined" && _.indexOf(item.acl, "WRITE") <  0) {
                            opt.commands['delete'].disabled = true;
                            opt.items['delete'].disabled = true;
                            opt.commands['edit'].disabled = true;
                            opt.items['edit'].disabled = true;
                            opt.commands['move'].disabled = true;
                            opt.items['move'].disabled = true;

                        } else {
                            opt.commands['delete'].disabled = false;
                            opt.items['delete'].disabled = false;
                            opt.commands['edit'].disabled = false;
                            opt.items['edit'].disabled = false;
                            opt.commands['move'].disabled = false;
                            opt.items['move'].disabled = false;
                        }

                        if ($(this).hasClass('folder_row')) {
                            opt.commands.open.disabled = true;
                            opt.items.open.disabled = true;
                        } else {
                            opt.commands.open.disabled = false;
                            opt.items.open.disabled = false;
                        }
                    }

                },
                callback: function(key, options) {
                    var path = $(this).find('a').attr('href').replace('#', '');
                    var item = self.queries[path];
                    self.selected_query = new SavedQuery({ file: path, name: item.name, type: item.type });
                    if (key == "open" && $(this).hasClass('query')) {
                        self.open_query();
                    } if (key == "edit" && $(this).hasClass('query')) {
                        self.edit_query();
                    } else if (key == "new") {
                        self.add_folder();
                    } else if (key == "delete") {
                        self.delete_repoObject();
                    } else if(key == "move"){
                        self.move_repoObject();
                    } else if(key =="opencontents"){
                        self.open_contents();
                    }


                },
                items: menuitems
            });
            
		// Fire off new openQuery event
		Saiku.session.trigger('openQuery:new', { openQuery: this });

        if (Settings.REPOSITORY_LAZY) {
            this.$el.find('.search_file').prop('disabled', true);
        }

        return this;
    },

    initialize: function(args) {
        // Maintain `this`
        _.bindAll(this, "adjust", "fetch_queries",
                "clear_query","select_and_open_query", "cancel_search", "add_folder");

        // Initialize repository
        this.repository = new Repository({}, { dialog: this });
    },

    fetch_queries: function() {
        this.repository.fetch();
    },

    populate: function( repository ) {
        var self = this;
        self.template_repository_objects( repository );
        self.queries = {};
        function getQueries( entries ) {
            _.forEach( entries, function( entry ) {
                self.queries[ entry.path ] = entry;
                if( entry.type === 'FOLDER' ) {
                    getQueries( entry.repoObjects );
                }
            } );
        }
        getQueries( repository );
    },

    search_file: function(event) {
        var filter = $(this.el).find('.search_file').val().toLowerCase();
        var isEmpty = (typeof filter == "undefined" || filter === "" || filter === null);
        if (isEmpty || event.which == 27 || event.which == 9) {
            this.cancel_search();
        } else {
            if ($(this.el).find('.search_file').val()) {
                $(this.el).find('.cancel_search').show();
            } else {
                $(this.el).find('.cancel_search').hide();
            }
            $(this.el).find('li.query').removeClass('hide');
            $(this.el).find('li.query a').each(function (index) {
                if($(this).text().toLowerCase().indexOf(filter) == -1) {
                    $(this).parent('li.query').addClass('hide');
                }
            });
            $(this.el).find('li.folder').addClass('hide');
            $(this.el).find('li.query').not('.hide').parents('li.folder').removeClass('hide');
            //$(this.el).find( 'li.folder .folder_content').not(':has(.query:visible)').parent().addClass('hide');

            //not(':contains("' + filter + '")').parent().hide();
            $(this.el).find( 'li.folder .folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $(this.el).find( 'li.folder .folder_content' ).removeClass('hide');
        }
        return false;
    },
    cancel_search: function(event) {
        $(this.el).find('input.search_file').val('');
        $(this.el).find('.cancel_search').hide();
        $(this.el).find('li.query, li.folder').removeClass('hide');
        $(this.el).find( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
        $(this.el).find( 'li.folder .folder_content' ).addClass('hide');
        $(this.el).find('.search_file').val('').focus();
        $(this.el).find('.cancel_search').hide();

    },
    view_query: function(event) {
        event.preventDefault( );
        var $currentTarget = $( event.currentTarget );
        var $target = $currentTarget.find('a');
        this.unselect_current_selected( );
        $currentTarget.addClass( 'selected' );
        var path = $target.attr('href').replace('#', '');
        var name = $target.text();
        var query = this.queries[path];
        $( this.el ).find( '.workspace_toolbar' ).removeClass( 'hide' );
        $( this.el ).find( '.for_queries' ).addClass( 'hide' );
        $( this.el ).find( '.for_folder' ).addClass( 'hide' );
        $( this.el ).find( '.add_folder' ).parent().addClass( 'hide' );

        if (typeof query.acl != "undefined" && _.indexOf(query.acl, "READ") > -1) {
            $( this.el ).find( '.for_queries .run' ).parent().removeClass( 'hide' );
        }
        if (typeof query.acl != "undefined" && _.indexOf(query.acl, "WRITE") > -1) {
            $( this.el ).find( '.for_queries .delete' ).parent().removeClass( 'hide' );
            $( this.el ).find( '.for_queries .edit' ).parent().removeClass( 'hide' );
        }
        if (typeof query.acl != "undefined" && _.indexOf(query.acl, "GRANT") > -1) {
            $( this.el ).find( '.for_queries .edit_permissions' ).parent().removeClass( 'hide' );
        }
        try {
            var query_path = path.split("/");
            if (query_path.length > 1) {
                    var folder_path = query_path.splice(0,query_path.length - 1).join("/");
                    var folder = this.queries[folder_path];
                    if (typeof folder.acl != "undefined" && _.indexOf(folder.acl, "WRITE") > -1) {
                        $( this.el ).find( '.add_folder' ).parent().removeClass( 'hide' );
                    }
            } else if (query_path.length == 1) {
                $( this.el ).find( '.add_folder' ).parent().removeClass( 'hide' );
            }
        } catch(e) {
            //console.log(e);
        }


        var $results = $(this.el).find('.workspace_results')
            .html('<h3><strong>' + query.name + '</strong></h3>');
        var $properties = $('<ul id="query_info" />').appendTo($results);

        // Iterate through properties and show a key=>value set in the information pane
        for (var property in query) {
            if (query.hasOwnProperty(property) && property != "name") {
                $properties.append($('<li />').html("<strong>" +
                        property + "</strong> : " + query[property]));
            }
        }

        this.selected_query = new SavedQuery({ file: path, name: name, type: query.type });

        return false;
    },

    view_folder: function( event ) {
        var $target = $( event.currentTarget ).children('div').children('a');
        var path = $target.attr('href').replace('#', '');
        var name = $target.text();
        var folder = this.queries[path];
        $( this.el ).find( '.workspace_toolbar' ).removeClass( 'hide' );
        $( this.el ).find( '.add_folder' ).parent().addClass( 'hide' );
        $( this.el ).find( '.for_queries' ).addClass( 'hide' );
        $( this.el ).find( '.for_folder' ).addClass( 'hide' );

        if (typeof folder.acl != "undefined" && _.indexOf(folder.acl, "WRITE") > -1) {
            $( this.el ).find( '.for_folder .delete' ).parent().removeClass( 'hide' );
            $( this.el ).find( '.add_folder' ).parent().removeClass( 'hide' );
        }
        if (typeof folder.acl != "undefined" && _.indexOf(folder.acl, "GRANT") > -1) {
            $( this.el ).find( '.for_folder .edit_permissions' ).parent().removeClass( 'hide' );
        }

        $( this.el ).find( '.workspace_results' )
            .html( '<h3><strong>' + name + '</strong></h3>' );

        this.selected_query = new SavedQuery({ file: path , name: name, type: folder.type });

    },

    prevent_default: function(event) {
        event.preventDefault();
        return false;
    },

    add_folder: function( event ) {
        $selected = $(this.el).find('.selected');
        var path ="";
        if (typeof $selected !== "undefined" && $selected) {
            if ($selected.hasClass('folder_row')) {
                path = $selected.children('a').attr('href');
                path = path.length > 1 ? path.substring(1,path.length) : path;
                path+= "/";

            } else if ($selected.hasClass('query') && !$selected.parent().hasClass('RepositoryObjects')) {
                var query = $selected.find('a');
                path = query.attr('href');
                var queryname = query.text();
                path = path.substring(1, path.length - queryname.length );
            }
        }

        (new AddFolderModal({
            path: path,
            success: this.clear_query
        })).render().open();

        return false;
    },

    click_canvas: function(event) {
        var $target = $( event.currentTarget );
        if ($target.hasClass('sidebar')) {
            $(this.el).find('.selected').removeClass('selected');
        }
        $( this.el ).find( '.add_folder' ).parent().removeClass( 'hide' );
        return false;
    },

    toggle_folder: function( event ) {
        var $target = $( event.currentTarget );
        var path = $target.children('.folder_row').find('a').attr('href');
        path = path.replace('#', '');
        this.unselect_current_selected( );
        $target.children('.folder_row').addClass( 'selected' );
        var $queries = $target.children( '.folder_content' );
        var isClosed = $target.children( '.folder_row' ).find('.sprite').hasClass( 'collapsed' );
        if( isClosed ) {
            $target.children( '.folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $queries.removeClass( 'hide' );
            if (Settings.REPOSITORY_LAZY) {
                this.fetch_lazyload($target, path);
            }
        } else {
            $target.children( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
            $queries.addClass( 'hide' );
            if (Settings.REPOSITORY_LAZY) {
                $target.find('.folder_content').remove();
            }
        }

        this.view_folder( event );

        return false;
    },

    fetch_lazyload: function(target, path) {
        var repositoryLazyLoad = new RepositoryLazyLoad({}, { dialog: this, folder: target, path: path });
        repositoryLazyLoad.fetch();
        Saiku.ui.block('Loading...');
    },
    
    template_repository_folder_lazyload: function(folder, repository) {
        folder.find('.folder_content').remove();
        folder.append(
            _.template($('#template-repository-folder-lazyload').html())({
                repoObjects: repository
            })
        );
    },

    populate_lazyload: function(folder, repository) {
        Saiku.ui.unblock();
        this.template_repository_folder_lazyload(folder, repository);
    },

    select_and_open_query: function(event) {
        var $target = $(event.currentTarget).find('a');
        var path = $target.attr('href').replace('#', '');
        var name = $target.text();
        this.selected_query = new SavedQuery({ file: path, name: path });
        this.open_query();
    },

    open_query: function(viewstate) {
        Saiku.ui.block("Opening query...");
        var item = this.queries[this.selected_query.get('file')];
        var params = _.extend({
                        file: this.selected_query.get('file'),
                        formatter: Settings.CELLSET_FORMATTER
                    }, Settings.PARAMS);

        var query = new Query(params,{ name: this.selected_query.get('name') });
        var state = null;
        if(viewstate && !viewstate.hasOwnProperty('currentTarget')) {
            state = viewstate;
        }
        
        if (item.fileType === 'saiku') {
            var tab = Saiku.tabs.add(new Workspace({ query: query, item: item, viewState: state, processURI: false }));
        }
        else {
            Saiku.session.trigger('openQuery:open_query', { query: query, item: item, viewState: state });
        }
        
        return false;
    },
    open_contents: function(viewstate) {
        var files = [];
        var itemF = this.queries[this.selected_query.get('file')];
        _.forEach( itemF.repoObjects, function( entry){
           if(entry.type === "FILE"){
               files.push(entry);
           }
        });

        var obj = {files: files, viewstate: viewstate};

        (new WarningModal({
            title: 'Open Multiple Queries', message: '<span class="i18n">You are about to open</span> ' + files.length + ' <span class="i18n">queries</span>',
            okay: this.run_open_contents, okayobj: obj
        })).render().open();

        return false;
    },
    run_open_contents: function(fileargs){
        _.forEach( fileargs.files, function( entry ) {
            Saiku.ui.block("Opening query...");

            var item = entry;
            var params = _.extend({
                file: item.path,
                formatter: Settings.CELLSET_FORMATTER
            }, Settings.PARAMS);

            var query = new Query(params,{ name: item.name });
            var state = null;
            if(fileargs.viewstate && !fileargs.viewstate.hasOwnProperty('currentTarget')) {
                state = viewstate;
            }
            var tab = Saiku.tabs.add(new Workspace({ query: query, item: item, viewState: state, processURI: false }));

        });
    },
    edit_query: function() {
        this.open_query('edit');
    },

    delete_repoObject: function(event) {
        (new DeleteRepositoryObject({
            query: this.selected_query,
            success: this.clear_query
        })).render().open();

        return false;
    },

    move_repoObject: function(event) {
        (new MoveRepositoryObject({
            query: this.selected_query,
            success: this.clear_query
        })).render().open();

        return false;
    },

    edit_folder: function( event ) {
        alert( 'todo: edit folder properties/permissions' );
        return false;
    },

    edit_permissions: function(event) {
        (new PermissionsModal({
            workspace: this.workspace,
            title: "<span class='i18n'>Permissions</span>",
            file: this.selected_query.get('file')
        })).open();
    },

    clear_query: function() {
        $(this.el).find('.workspace_toolbar').addClass('hide');
        $(this.el).find('.workspace_results').html('');
        this.fetch_queries();
    },

    adjust: function() {
        // Adjust the height of the separator
        $separator = $(this.el).find('.sidebar_separator');
        $separator.height($("body").height() - 87);
        $(this.el).find('.sidebar').css( { 'width' : 350,
                                            'height' : $("body").height() - 87 });
        $(this.el).find('.workspace_inner').css({ 'margin-left' : 355});
        $(this.el).find('.workspace').css({ 'margin-left' : -355});
        // Adjust the dimensions of the results window
        $(this.el).find('.workspace_results').css({
            width: $(document).width() - $(this.el).find('.sidebar').width() - 30,
            height: $(document).height() - $("#header").height() -
                $(this.el).find('.workspace_toolbar').height() -
                $(this.el).find('.workspace_fields').height() - 40
        });
        //$(this.el).find('.canvas_wrapper').show();
    },

    toggle_sidebar: function() {
        // Toggle sidebar
        $(this.el).find('.sidebar').toggleClass('hide');
        var new_margin = $(this.el).find('.sidebar').hasClass('hide') ?
                5 : 265;
        $(this.el).find('.workspace_inner').css({ 'margin-left': new_margin });
    },

    unselect_current_selected: function( ) {
        $( this.el ).find( '.selected' ).removeClass( 'selected' );
    }

});
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
 * The save query dialog
 */
var SaveQuery = Modal.extend({
    type: "save",
    closeText: "Save",

    events: {
        'click': 'select_root_folder', /* select root folder */
        'click .dialog_footer a' : 'call',
        'submit form': 'save',
        'click .query': 'select_name',
        'click li.folder': 'toggle_folder',
        'keyup .search_file' : 'search_file',
        'click .cancel_search' : 'cancel_search'
    },

    buttons: [
        { text: "Save", method: "save" },
        { text: "Cancel", method: "close" }
    ],

    folder_name: null,
    file_name: null,

    initialize: function(args) {
        // Append events
        var self = this;
        var name = "";
        var full_path = "";
        if (args.query.name) {

			args.query.name = args.query.name.replace(/:/g, "/");
            var path = args.query.name.split('/');
			full_path = args.query.name;

            name = path[path.length -1];
            this.file_name = name;
            if (path.length > 1) {
                this.folder_name = path.splice(0,path.length - 1).join("/");
            }
        }
        this.query = args.query;
        // this.message = _.template(
        //     "<form id='save_query_form'>" +
        //     "<label for='name' class='i18n'>File:</label>&nbsp;" +
        //     "<input type='text' name='name' value='<%= name %>' />" +
        //     "<div class='RepositoryObjects'><span class='i18n'>Loading...</span></div>" +
        //     "<br />"+
        //     "</form>"+
        //     '<div class="box-search-file" style="height:25px; line-height:25px;"><b><span class="i18n">Search:</span></b> &nbsp;' +
        //     ' <span class="search"><input type="text" class="search_file"></input><span class="cancel_search"></span></span></div>')({ name: full_path });

        this.message = _.template(
            "<form id='save_query_form'>" +
            '<div class="box-search-file form-inline" style="height:35px; padding-top:10px; line-height:25px;"><label class="i18n">Search:</label> &nbsp;' +
            ' <input type="text" class="form-control search_file"></input><span class="cancel_search"></span></div>' +
            "<div class='RepositoryObjects'><span class='i18n'>Loading...</span></div>" +
            "<div class='form-inline' style='padding-top:4px'>"    +
            "<label for='name' class='i18n'>File:</label>&nbsp;" +
            "<input type='text' name='name' class='form-control' value='<%= name %>' /></div>" +
            "<br />"+
            "</form>")({ name: full_path });

        _.extend(this.options, {
            title: "Save query"
        });

        // Initialize repository
        this.repository = new Repository({}, { dialog: this });

        this.bind( 'open', function( ) {
            var height = ( $( "body" ).height() / 2 ) + ( $( "body" ).height() / 6 );
            if( height > 420 ) {
                height = 420;
            }
            var perc = (((($( "body" ).height() - 600) / 2) * 100) / $( "body" ).height());
            $(this.el).find('.RepositoryObjects').height( height );
            $(this.el).dialog( 'option', 'position', 'center' );
            $(this.el).parents('.ui-dialog').css({ width: "550px", top: perc+'%' });
            self.repository.fetch( );

            if (Settings.REPOSITORY_LAZY) {
                this.$el.find('.box-search-file').hide();
            }
        } );

        // Maintain `this`
        _.bindAll( this, "copy_to_repository", "close", "toggle_folder", "select_name", "populate", "set_name", "cancel_search" );

        // fix event listening in IE < 9
        if(isIE && isIE < 9) {
            $(this.el).find('form').on('submit', this.save);
        }


    },

    populate: function( repository ) {
        $( this.el ).find( '.RepositoryObjects' ).html(
            _.template( $( '#template-repository-objects' ).html( ) )( {
                repoObjects: repository
            } )
        );

        this.context_menu_disabled();
        this.select_last_location();

    },

    context_menu_disabled: function() {
        this.$el.find('.RepositoryObjects').find('.folder_row, .query').addClass('context-menu-disabled');
    },

    select_root_folder: function( event ) {
        var isNameInputField = $( event.target ).attr( 'name' ) === 'name';
        if( !isNameInputField ) {
            this.unselect_current_selected_folder( );
        }
    },

    toggle_folder: function( event ) {
        var $target = $( event.currentTarget );
        var path = $target.children('.folder_row').find('a').attr('href');
        path = path.replace('#', '');
        this.unselect_current_selected_folder( );
        $target.children('.folder_row').addClass( 'selected' );
        var f_name = $target.find( 'a' ).attr('href').replace('#', '');
        this.set_name(f_name, null);


        var $queries = $target.children( '.folder_content' );
        var isClosed = $target.children( '.folder_row' ).find('.sprite').hasClass( 'collapsed' );
        if( isClosed ) {
            $target.children( '.folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $queries.removeClass( 'hide' );
            if (Settings.REPOSITORY_LAZY) {
                this.fetch_lazyload($target, path);
            }
        } else {
            $target.children( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
            $queries.addClass( 'hide' );
            if (Settings.REPOSITORY_LAZY) {
                $target.find('.folder_content').remove();
            }
        }
        this.set_last_location(path);
        $(this.el).find('input[name="name"]').focus();
        return false;
    },

    fetch_lazyload: function(target, path) {
        var repositoryLazyLoad = new RepositoryLazyLoad({}, { dialog: this, folder: target, path: path });
        repositoryLazyLoad.fetch();
        Saiku.ui.block('Loading...');
    },
    
    template_repository_folder_lazyload: function(folder, repository) {
        folder.find('.folder_content').remove();
        folder.append(
            _.template($('#template-repository-folder-lazyload').html())({
                repoObjects: repository
            })
        );
    },

    populate_lazyload: function(folder, repository) {
        Saiku.ui.unblock();
        this.template_repository_folder_lazyload(folder, repository);
    },

    set_name: function(folder, file) {
        if (folder !== null) {
            this.folder_name = folder;
            var name = (this.folder_name !== null ? this.folder_name + "/" : "") + (this.file_name !== null ? this.file_name : "");
            $(this.el).find('input[name="name"]').val( name );
        }
        if (file !== null) {
            $(this.el).find('input[name="name"]').val( file );
        }

    },

    // XXX - duplicaten from OpenQuery
        search_file: function(event) {
        var filter = $(this.el).find('.search_file').val().toLowerCase();
        var isEmpty = (typeof filter == "undefined" || filter === "" || filter === null);
        if (isEmpty || event.which == 27 || event.which == 9) {
            this.cancel_search();
        } else {
            if ($(this.el).find('.search_file').val()) {
                $(this.el).find('.cancel_search').show();
            } else {
                $(this.el).find('.cancel_search').hide();
            }
            $(this.el).find('li.query').removeClass('hide');
            $(this.el).find('li.query a').filter(function (index) {
                return $(this).text().toLowerCase().indexOf(filter) == -1;
            }).parent().addClass('hide');
            $(this.el).find('li.folder').addClass('hide');
            $(this.el).find('li.query').not('.hide').parents('li.folder').removeClass('hide');
            //$(this.el).find( 'li.folder .folder_content').not(':has(.query:visible)').parent().addClass('hide');

            //not(':contains("' + filter + '")').parent().hide();
            $(this.el).find( 'li.folder .folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $(this.el).find( 'li.folder .folder_content' ).removeClass('hide');
        }
        return false;
    },
    cancel_search: function(event) {
        $(this.el).find('input.search_file').val('');
        $(this.el).find('.cancel_search').hide();
        $(this.el).find('li.query, li.folder').removeClass('hide');
        $(this.el).find( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
        $(this.el).find( 'li.folder .folder_content' ).addClass('hide');
        $(this.el).find('.search_file').val('').focus();
        $(this.el).find('.cancel_search').hide();

    },




    select_name: function( event ) {
        var $currentTarget = $( event.currentTarget );
        this.unselect_current_selected_folder( );
        //$currentTarget.parent( ).parent( ).has( '.folder' ).children('.folder_row').addClass( 'selected' );
        $currentTarget.addClass('selected');
        var name = $currentTarget.find( 'a' ).attr('href').replace('#','');
        this.set_name(null, name);
        var path = $currentTarget.parent( ).parent( ).has( '.folder' ).children('.folder_row').find( 'a' ).attr('href');
        path = path.replace('#' , '');
        this.set_last_location(path);
        $(this.el).find('input[name="name"]').focus();

        return false;
    },

    unselect_current_selected_folder: function( ) {
        $( this.el ).find( '.selected' ).removeClass( 'selected' );
    },

    save: function(event) {
        // Save the name for future reference
        var foldername = ''; /* XXX == root, should it be something different than ''? */
        /*
        var $folder = $(this.el).find( '.folder_row.selected a' ).first( );
        if( $folder.length ) {
            foldername = $folder.attr( 'href' ).replace( '#', '' );
            foldername = (foldername != null && foldername.length > 0 ? foldername + "/" : "");
        }
        */

		var self = this;

        var name = $(this.el).find('input[name="name"]').val();
        if (this.folder_name !== null && this.folder_name !== undefined && this.folder_name.length > 0) {
            if (name !== null && name.length > 0) {
    			this.repository.fetch({success: function(collection, response){


    				var paths=[];
    				paths.push.apply(paths, self.get_files(response));
    				if(paths.indexOf(name)> -1 && self.query.get("name")!=name){
    					new OverwriteModal({name: name, foldername: foldername, parent: self}).render().open();
    				}
    				else{
    					 self.query.set({ name: name, folder: foldername });
    					 self.query.trigger('query:save');
    					 self.copy_to_repository();
    					 event.stopPropagation();
    					 event.preventDefault();
    					 return false;
    				}

    				}});




            } else {
                alert("You need to enter a name!");
            }
        }
        else {
            alert("You need select a folder!");
        }

return false;
    },

	save_remote: function(name, foldername, parent){
		parent.query.set({ name: name, folder: foldername });
		parent.query.trigger('query:save');
		parent.copy_to_repository();
		event.preventDefault();
		return false;
	},

	get_files: function(response){
		var self = this;
		var paths = [];
		_.each( response, function( entry ){
			if( entry.type === 'FOLDER' ) {
				paths.push.apply(paths, self.get_files(entry.repoObjects));
			}
			else{
				paths.push(entry.path);

			}
		});
			return paths;
	},
    copy_to_repository: function() {
        var self = this;
        var folder = this.query.get('folder');
        var file = this.query.get('name');
        file = file.length > 6 && file.indexOf(".saiku") == file.length - 6 ? file : file + ".saiku";
        file = folder + file;
        var error = function(data, textStatus, jqXHR) {
                if (textStatus && textStatus.status == 403 && textStatus.responseText) {
                    alert(textStatus.responseText);
                } else {
                    self.close();
                }
                return true;
        };

        // Rename tab
        this.query.workspace.tab.$el.find('.saikutab').text(file.replace(/^.*[\\\/]/, '').split('.')[0]);

        (new SavedQuery({
            name: this.query.get('name'),
            file: file,
            content: JSON.stringify(this.query.model)
        })).save({},{ success:  this.close, error: error, dataType: 'text'  });
    },

    set_last_location: function(path){
        if (typeof localStorage !== "undefined" && localStorage && !Settings.REPOSITORY_LAZY) {
            if (!Settings.LOCALSTORAGE_EXPIRATION || Settings.LOCALSTORAGE_EXPIRATION === 0) {
                localStorage.clear();
            }
            else {
                localStorage.setItem('last-folder', path);
            }

        }
    },

    select_last_location: function(){
        if(localStorage.getItem('last-folder') && !Settings.REPOSITORY_LAZY){
            var p = $(this.el).find('a[href="\\#'+localStorage.getItem('last-folder')+'"]')

            var path = p.parent().parent().has('.folder').children('.folder_row').find('.sprite').removeClass('collapsed');

            var parents = path.parentsUntil($("div.RepositoryObjects"));

            parents.each(function () {
                if ($(this).hasClass('folder')) {
                    $(this).children('.folder_row').find('.sprite').removeClass('collapsed');
                    $(this).children('.folder_content').removeClass('hide');

                }

            });

        }



    }
});
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
 * The save query dialog
 */
var OpenDialog = Modal.extend({
    type: "save",
    closeText: "Open",

    events: {
        'click': 'select_root_folder', /* select root folder */
        'click .dialog_footer a' : 'call',
        'click .query': 'select_name',
        'dblclick .query': 'open_query',
        'click li.folder': 'toggle_folder',
        'keyup .search_file' : 'search_file',
        'click .cancel_search' : 'cancel_search',
        'click .export_btn' : 'export_zip', 
        'change .file' : 'select_file'
    },
    
    buttons: [
        { id: "test", text: "Open", method: "open_query" },
        { text: "Cancel", method: "close" }
    ],

    initialize: function(args) {
        // Append events
        var self = this;
        var name = "";
        // this.message =  "<br/><b><div class='query_name'><span class='i18n'>Please select a file.....</span></div></b><br/><div class='RepositoryObjects'>Loading....</div>" +
        //                 "<br>" +
        //                 '<div class="box-search-file" style="height:25px; line-height:25px;"><b><span class="i18n">Search:</span></b> &nbsp;' +
        //                 ' <span class="search"><input type="text" class="search_file"></input><span class="cancel_search"></span></span></div>';

        this.message =  '<div class="box-search-file form-inline" style="padding-top:10px; height:35px; line-height:25px;"><label class="i18n">Search:</label> &nbsp;' +
                        ' <input type="text" class="form-control search_file"></input><span class="cancel_search"></span></div>' +
                        "<div class='RepositoryObjects i18n'>Loading...</div>" +
                        "<br>" +
                        "<b><div class='query_name'><span class='i18n'>Please select a file.....</span></div></b><br/>";

        if (Settings.ALLOW_IMPORT_EXPORT) {
            this.message += "<span class='export_zip'> </span> <b><span class='i18n'>Import or Export Files for Folder</span>: </b> <span class='i18n zip_folder'>< Select Folder... ></span>" +
                            " &nbsp; <input type='submit' value='Export' class='export_btn' disabled /><br/><br />" +
                            "<br /><form id='importForm' target='_blank' method='POST' enctype='multipart/form-data'>" +
                            "<input type='hidden' name='directory' class='directory'/>" +
                            "<input type='file' name='file' class='file'/>" +
                            "<input type='submit' value='Import' class='import_btn' disabled />" +
                            "</form>";
        }
        _.extend(this.options, {
            title: "Open"
        });

        this.selected_folder = null;

        // Initialize repository
        this.repository = new Repository({}, { dialog: this });

        this.bind( 'open', function( ) {
            var height = ( $( "body" ).height() / 2 ) + ( $( "body" ).height() / 6 );
            if( height > 420 ) {
                height = 420;
            }
            var perc = (((($( "body" ).height() - 600) / 2) * 100) / $( "body" ).height());
            $(this.el).find('.RepositoryObjects').height( height );
            $(this.el).dialog( 'option', 'position', 'center' );
            $(this.el).parents('.ui-dialog').css({ width: "550px", top: perc+'%' });
            $(this.el).find('.dialog_footer').find('a[href="#open_query"]').hide();

            self.repository.fetch( );

            if (Settings.REPOSITORY_LAZY) {
                this.$el.find('.box-search-file').hide();
            }
        } );


        // Maintain `this`
        _.bindAll( this, "close", "toggle_folder", "select_name", "populate" , "cancel_search", "export_zip", "select_folder", "select_file", "select_last_location");

    
    },

    populate: function( repository ) {
        var self = this;
        $( this.el ).find( '.RepositoryObjects' ).html(
            _.template( $( '#template-repository-objects' ).html( ) )( {
                repoObjects: repository
            } ) 
        );

        self.queries = {};
        function getQueries( entries ) {
            _.forEach( entries, function( entry ) {
                self.queries[ entry.path ] = entry;
                if( entry.type === 'FOLDER' ) {
                    getQueries( entry.repoObjects );
                }
            } );
        }
        getQueries( repository );
        this.context_menu_disabled();
        this.select_last_location();
    },

    context_menu_disabled: function() {
        this.$el.find('.RepositoryObjects').find('.folder_row, .query').addClass('context-menu-disabled');
    },

    select_root_folder: function( event ) {
        var isNameInputField = $( event.target ).attr( 'name' ) === 'name';
        if( !isNameInputField ) {
            this.unselect_current_selected_folder( );
        }
    },

    toggle_folder: function( event ) {
        var $target = $( event.currentTarget );
        var path = $target.children('.folder_row').find('a').attr('href');
        path = path.replace('#', '');
        this.unselect_current_selected_folder( );
        $target.children('.folder_row').addClass( 'selected' );
        var $queries = $target.children( '.folder_content' );
        var isClosed = $target.children( '.folder_row' ).find('.sprite').hasClass( 'collapsed' );
        if( isClosed ) {
            $target.children( '.folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $queries.removeClass( 'hide' );
            if (Settings.REPOSITORY_LAZY) {
                this.fetch_lazyload($target, path);
            }
        } else {
            $target.children( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
            $queries.addClass( 'hide' );
            if (Settings.REPOSITORY_LAZY) {
                $target.find('.folder_content').remove();
            }
        }

        this.select_folder();
        this.set_last_location(path);
        return false;
    },

    fetch_lazyload: function(target, path) {
        var repositoryLazyLoad = new RepositoryLazyLoad({}, { dialog: this, folder: target, path: path });
        repositoryLazyLoad.fetch();
        Saiku.ui.block('Loading...');
    },
    
    template_repository_folder_lazyload: function(folder, repository) {
        folder.find('.folder_content').remove();
        folder.append(
            _.template($('#template-repository-folder-lazyload').html())({
                repoObjects: repository
            })
        );
    },

    populate_lazyload: function(folder, repository) {
        Saiku.ui.unblock();
        this.template_repository_folder_lazyload(folder, repository);
    },

    select_name: function( event ) {
        var $currentTarget = $( event.currentTarget );
        this.unselect_current_selected_folder( );
        //$currentTarget.parent( ).parent( ).has( '.folder' ).children('.folder_row').addClass( 'selected' );
        var path = $currentTarget.parent( ).parent( ).has( '.folder' ).children('.folder_row').find( 'a' ).attr('href');
        path = path.replace('#' , '');
        this.set_last_location(path);
        $currentTarget.addClass('selected');
        var name = $currentTarget.find( 'a' ).attr('href');
        name = name.replace('#','');
        $(this.el).find('.query_name').html( name );
        $(this.el).find('.dialog_footer').find('a[href="#open_query"]').show();
        this.select_folder();
        return false;
    },

    unselect_current_selected_folder: function( ) {
        $( this.el ).find( '.selected' ).removeClass( 'selected' );
    },

    // XXX - duplicaten from OpenQuery
    search_file: function(event) {
        var filter = $(this.el).find('.search_file').val().toLowerCase();
        var isEmpty = (typeof filter == "undefined" || filter === "" || filter === null);
        if (isEmpty || event.which == 27 || event.which == 9) {
            this.cancel_search();
        } else {
            if ($(this.el).find('.search_file').val()) {
                $(this.el).find('.cancel_search').show();
            } else {
                $(this.el).find('.cancel_search').hide();
            }
            $(this.el).find('li.query').removeClass('hide');
            $(this.el).find('li.query a').filter(function (index) { 
                return $(this).text().toLowerCase().indexOf(filter) == -1; 
            }).parent().addClass('hide');
            $(this.el).find('li.folder').addClass('hide');
            $(this.el).find('li.query').not('.hide').parents('li.folder').removeClass('hide');
            //$(this.el).find( 'li.folder .folder_content').not(':has(.query:visible)').parent().addClass('hide');

            //not(':contains("' + filter + '")').parent().hide();
            $(this.el).find( 'li.folder .folder_row' ).find('.sprite').removeClass( 'collapsed' );
            $(this.el).find( 'li.folder .folder_content' ).removeClass('hide');
        }
        return false;
    },
    cancel_search: function(event) {
        $(this.el).find('input.search_file').val('');
        $(this.el).find('.cancel_search').hide();
        $(this.el).find('li.query, li.folder').removeClass('hide');
        $(this.el).find( '.folder_row' ).find('.sprite').addClass( 'collapsed' );
        $(this.el).find( 'li.folder .folder_content' ).addClass('hide');
        $(this.el).find('.search_file').val('').focus();
        $(this.el).find('.cancel_search').hide();

    },

    export_zip: function(event) {
        var file = this.selected_folder;
        if (typeof file != "undefined" && file !== "") {
            var url = Settings.REST_URL + (new RepositoryZipExport({ directory : file })).url();
            window.open(url + "?directory=" + file + "&type=saiku");
        }
    },

    select_folder: function() {
        var foldersSelected = $( this.el ).find( '.selected' );
        var file = foldersSelected.length > 0 ? foldersSelected.children('a').attr('href').replace('#','') : null;
        if (typeof file != "undefined" && file !== null && file !== "") {
            var form = $('#importForm');
            form.find('.directory').val(file);
            var url = Settings.REST_URL + (new RepositoryZipExport()).url() + "upload";
            form.attr('action', url);
            $(this.el).find('.zip_folder').text(file);
            this.selected_folder = file;
            $(this.el).find('.export_btn, .import_btn').removeAttr('disabled');
            this.select_file();
        } else {
            $(this.el).find('.import_btn, .export_btn').attr('disabled', 'true');
        }        

    },

    select_file: function() {
            var form = $('#importForm');
            var filename = form.find('.file').val();
            if (typeof filename != "undefined" && filename !== "" && filename !== null && this.selected_folder !== null) {
                $(this.el).find('.import_btn').removeAttr('disabled');
            } else {
                $(this.el).find('.import_btn').attr('disabled', 'true');
            }
    },

    open_query: function(event) {
        // Save the name for future reference
        var $currentTarget = $( event.currentTarget );
        var file = $(this.el).find('.query_name').html();
        if ($currentTarget.hasClass('query')) {
            file = $currentTarget.find( 'a' ).attr('href').replace('#','');
        }

        var selected_query = new SavedQuery({ file: file });
        this.close();
        Saiku.ui.block("Opening query...");
        var item = this.queries[file];
                var params = _.extend({ 
                        file: file,
                        formatter: Settings.CELLSET_FORMATTER
                    }, Settings.PARAMS);

        var query = new Query(params,{ name: file  });
        var tab = Saiku.tabs.add(new Workspace({ query: query, item: item, processURI: false }));

        event.preventDefault();
        return false;
    },

    set_last_location: function(path){
        if (typeof localStorage !== "undefined" && localStorage && !Settings.REPOSITORY_LAZY) {
            if (!Settings.LOCALSTORAGE_EXPIRATION || Settings.LOCALSTORAGE_EXPIRATION === 0) {
                localStorage.clear();
            }
            else {
                localStorage.setItem('last-folder', path);
            }

        }
    },

    select_last_location: function(){
        if(localStorage.getItem('last-folder') && !Settings.REPOSITORY_LAZY){
            var p = $(this.el).find('a[href="\\#'+localStorage.getItem('last-folder')+'"]')

                var path = p.parent().parent().has('.folder').children('.folder_row').find('.sprite').removeClass('collapsed');

                var parents = path.parentsUntil($("div.RepositoryObjects"));

                parents.each(function () {
                    if ($(this).hasClass('folder')) {
                        $(this).children('.folder_row').find('.sprite').removeClass('collapsed');
                        $(this).children('.folder_content').removeClass('hide');

                    }

                });

            }



    }
});
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
 * Class which handles individual tabs
 */
var Tab = Backbone.View.extend({
    tagName: 'li',

    events: {
        'click a': 'select',
        'mousedown a': 'remove',
        'click .close_tab': 'remove'
    },

    template: function() {
        // Create tab
        return _.template("<a class='saikutab' href='#<%= id %>'><%= caption %></a>" +
                "<span class='close_tab sprite'>Close tab</span>")
            ({
                id: this.id,
                caption: this.caption
            });
    },

    /**
     * Assign a unique ID and assign a Backbone view
     * to handle the tab's contents
     * @param args
     */
    initialize: function(args) {
        _.extend(this, Backbone.Events);
        _.extend(this, args);
        this.content.tab = this;
        this.caption = this.content.caption();
        this.id = _.uniqueId('tab_');
        this.close = args.close;
    },

    /**
     * Render the tab and its contents
     * @returns tab
     */
    render: function() {
        var self = this;
        // Render the content
        this.content.render();

        // Generate the element
        $(this.el).html(this.template());
        if(this.close === false){
            $(this.el).find('.close_tab').hide();
            $(this.el).css('padding-right','10px');
        }
        var menuitems = {
            "new": {name: "New", i18n: true },
            "duplicate": { name: "Duplicate", i18n: true},
            "closeothers": {name: "Close Others", i18n: true },
            "closethis": {name: "Close This", i18n: true }
        };
        $.each(menuitems, function(key, item){
            recursive_menu_translate(item, Saiku.i18n.po_file);
        });

        $.contextMenu('destroy', '.saikutab');
        $.contextMenu({
                selector: '.saikutab',
                callback: function(key, options) {
                    var selected = options.$trigger.attr('href').replace('#','');
                    var tab = Saiku.tabs.find(selected);
                 	  if (key == "closethis") {
                        tab.remove();
                        self.select();
                        return;
                    } else if (key == "closeothers") {
                        tab.select();
                        Saiku.tabs.close_others(tab);
                    } else if (key == "duplicate") {
                        Saiku.tabs.duplicate(tab);
                    } else if (key == "new") {
                        Saiku.tabs.new_tab();
                    }
                    //self.workspace.chart.exportChart(key);
                },
                items: menuitems
            });

        return this;
    },

    set_caption: function(caption) {
        $(this.el).find('.saikutab').html(caption);
    },

    /**
     * Destroy any data associated with this tab and ensure proper
     * garbage collection to avoid memory leaks
     */
    destroy: function() {
        // Delete data
        if (this.content && this.content.query) {
            this.content.query.destroy();
        }
    },

    /**
     * Select a tab
     * @param el
     */
    select: function() {
        var self = this;
        // Deselect all tabs
        this.parent.select(this);

        // Select the selected tab
        $(this.el).addClass('selected');

        // Trigger select event
        this.trigger('tab:select');
        return false;
    },

    /**
     * Remove a tab
     * @returns {Boolean}
     */
    remove: function(event) {
        if (!event || event.which === 2 || $(event.target).hasClass('close_tab')) {
            // Remote the tab object from the container
            this.parent.remove(this);

            try {
                // Remove the tab element
                $(this.el).remove();

                // Remove the tab
                this.destroy();
            } catch (e) {
                Log.log(JSON.stringify({
                    Message: "Tab could not be removed",
                    Tab: JSON.stringify(this)
                }));
            }
        }

        return false;
    },

    rendered: function() {
        return $.contains( document, this.el );
    }

});

/**
 * Class which controls tab pager
 */
var TabPager = Backbone.View.extend({
    className: 'pager_contents',
    events: {
        'click a': 'select'
    },

    initialize: function(args) {
        this.tabset = args.tabset;
        $(this.el).hide().appendTo('body');

        // Hide when focus is lost
        $(window).click(function(event) {
            if (! $(event.target).hasClass('pager_contents')) {
                $('.pager_contents').hide();
            }
        });
    },

    render: function() {
        var pager = "";
        for (var i = 0, len = this.tabset._tabs.length; i < len; i++) {
            pager += "<a href='#" + i + "'>" +
                this.tabset._tabs[i].caption + "</a><br />";
        }
        $(this.el).html(pager);
        $(this.el).find(".i18n").i18n(Saiku.i18n.po_file);
    },

    select: function(event) {
        var index = $(event.target).attr('href').replace('#', '');
        this.tabset._tabs[index].select();
        $(this.el).hide();
        event.preventDefault();
        return false;
    }
});


/**
 * Created by bugg on 14/11/14.
 */
/**
 * Class which controls the tab collection
 */
var TabSet = Backbone.View.extend({
	className: 'tabs',
	queryCount: 0,
	dashCount: 0,

	events: {
		'click a.pager': 'togglePager' ,
		'click a.new' : 'new_tab'
	},

	_tabs: [],

	/**
	 * Render the tab containers
	 * @returns tab_container
	 */
	render: function() {
		$(this.el).html('<a href="#pager" class="pager sprite"></a><ul><li class="newtab"><a class="new">+&nbsp;&nbsp;</a></li></ul>')
			.appendTo($('#header'));
		this.content = $('<div id="tab_panel">').appendTo($('body'));
		this.pager = new TabPager({ tabset: this });
		return this;
	},

	/**
	 * Add a tab to the collection
	 * @param tab
	 */
	add: function(content, close) {
		// Add it to the set
		if (content.pluginName === 'dashboards') {
			this.dashCount++;
		}
		else {
			this.queryCount++;
		}

		var tab = new Tab({ content: content, close: close});
		this._tabs.push(tab);
		tab.parent = this;

		// Render it in the background, then select it
		tab.render().select();
		$(tab.el).insertBefore($(this.el).find('ul li.newtab'));

		// Trigger add event on session
		Saiku.session.trigger('tab:add', { tab: tab });
		this.pager.render();
		Saiku.i18n.translate();
		Saiku.session.trigger('workspace:toolbar:render',null);
		return tab;
	},

	find: function(id) {
		for (var i = 0, len = this._tabs.length; i < len; i++) {
			if (this._tabs[i].id == id) {
				return this._tabs[i];
			}
		}
		return null;
	},

	/**
	 * Select a tab, and move its contents to the tab panel
	 * @param tab
	 */
	select: function(tab) {
		// Clear selections
		$(this.el).find('li').removeClass('selected');

		Saiku.session.tabSelected = tab.id;
		Saiku.session.trigger('tab:select', { tab: tab });

		// Replace the contents of the tab panel with the new content

		this.content.children().detach();
		this.content.append($(tab.content.el));

	},

	/**
	 * Remove a tab from the collection
	 * @param tab
	 */
	remove: function(tab) {
		// Add another tab if the last one has been deleted
		if (this._tabs.length == 1) {
			//this.add(new Workspace());

		}

		for (var i = 0, len = this._tabs.length; i < len; i++) {
			if (this._tabs[i] == tab) {
				// Remove the element
				this._tabs.splice(i, 1);

				Saiku.session.trigger('tab:remove', { tab: tab });
				this.pager.render();
				// Select the previous, or first tab
				var next = this._tabs[i] ? i : (this._tabs.length - 1);
				this._tabs[next].select();
			}
		}

		return true;
	},

	close_others: function(tab) {
		var index = _.indexOf(this._tabs, tab);
		this._tabs[index].select();

		// Remove tabs placed before and after selected tab
		var i = 0;
		while(1 < this._tabs.length){
			if (this._tabs[i] != tab)
				this._tabs[i].remove();
			else
				i++;
		}
	},

	close_all: function() {
		for (var i = 0, len = this._tabs.length; i < len; i++) {
			var otherTab = this._tabs[i];
			otherTab.remove();
		}
	},

	togglePager: function() {
		$(this.pager.el).toggle();
		return false;
	},

	new_tab: function() {
		this.add(new Workspace());
		var next = this._tabs.length - 1;
		this._tabs[next].select();
		return false;
	},

	duplicate: function(tab) {
		// Block UI to prevent other events
		Saiku.ui.block("Duplicating tab...");

		// Check for empty query
		if(tab.content.query){
			// For versions using Query2Resource
			this.add(new Workspace({
				query : new Query({
					json : JSON.stringify(tab.content.query.model)
				}, Settings.PARAMS),
				viewState : tab.content.viewState
			}));

		} else {
			this.add(new Workspace());
		}

		// Unblock UI and restore functionality
		Saiku.ui.unblock();
		return false;
	}
});
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
 * Repository query
 */
var RepositoryUrl = "api/repository";
var repoPathUrl = function() {
    /*
    return (Settings.BIPLUGIN5 ? "/repository"
                    : (Settings.BIPLUGIN ? "/pentahorepository2" : "/repository2"));
    */
    if (Settings.BIPLUGIN)
        return "pentaho/repository";

    return  RepositoryUrl;
};

var RepositoryObject = Backbone.Model.extend({
    initialize: function(args, options) {
        if (options && options.dialog) {
            this.dialog = options.dialog;
            this.file = options.file;
        }
    },

    parse: function(response) {
        if (this.dialog) {
            this.dialog.generate_grids_reports(response);
            return response;
        }
    },

    url: function() {
        var segment;
        if (this.file) {
            segment = repoPathUrl() + '/resource?file=' + this.file;
        }
        else {
            segment = repoPathUrl() + '/resource';
        }
        return segment;
    }
});

var RepositoryAclObject = Backbone.Model.extend( {
    url: function( ) {
        var segment = repoPathUrl() + "/resource/acl";
        return segment;
    },
    parse: function(response) {
        if (response != "OK") {
            _.extend(this.attributes, response);
        }
    }
} );

var RepositoryZipExport = Backbone.Model.extend( {
    url: function( ) {
        var segment = repoPathUrl() + "/zip";
        return segment;
    }
} );

var SavedQuery = Backbone.Model.extend({

    parse: function(response) {
        //console.log("response: " + response);
        //this.xml = response;
    },

    url: function() {
        var u = repoPathUrl() + "/resource";
        return u;

    },

    move_query_to_workspace: function(model, response) {
        var file = response;
        var filename = model.get('file');
        for (var key in Settings) {
            if (key.match("^PARAM")=="PARAM") {
                var variable = key.substring("PARAM".length, key.length);
                var Re = new RegExp("\\$\\{" + variable + "\\}","g");
                var Re2 = new RegExp("\\$\\{" + variable.toLowerCase() + "\\}","g");
                file = file.replace(Re,Settings[key]);
                file = file.replace(Re2,Settings[key]);

            }
        }
        var query = new Query({
            xml: file,
            formatter: Settings.CELLSET_FORMATTER
        },{
            name: filename
        });

        var tab = Saiku.tabs.add(new Workspace({ query: query }));
    }
});

/**
 * Repository adapter
 */
var Repository = Backbone.Collection.extend({
    model: SavedQuery,
	file: null,
    initialize: function(args, options) {
        if (options && options.dialog) {
            this.dialog = options.dialog;
            this.type = options.type;
        }
    },

    parse: function(response) {
        if (this.dialog) {
            this.dialog.populate(response);
        }
		return response;
    },

	url: function() {
        var segment = repoPathUrl() + '?type=' + (this.type ? this.type : 'saiku,sdb');
		if (Settings.REPO_BASE && !this.file) {
			segment += '&path=' + Settings.REPO_BASE;
		}
		return segment;
	}
});

var RepositoryLazyLoad = Backbone.Model.extend({    
    url: function() {
        var segment = repoPathUrl() + '?type=' + (this.type ? this.type : 'saiku,sdb') + '&path=' + this.path;
        return segment;
    },

    initialize: function(args, options) {
        if (options && options.dialog) {
            this.dialog = options.dialog;
            this.folder = options.folder;
            this.path = options.path;
        }
    },

    parse: function(response) {
        if (this.dialog) {
            this.dialog.populate_lazyload(this.folder, response);
        }
        return response;
    }
});
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
 * Holds the resultset for a query, and notifies plugins when resultset updated
 */
var Result = Backbone.Model.extend({

    result: null,
    firstRun: false,
    
    initialize: function(args, options) {
        // Keep reference to query
        this.query = options.query;
    },
    
    parse: function(response) {
        // Show the UI if hidden
        this.query.workspace.unblock();
        this.query.workspace.processing.hide();
        this.result = response;
        if (!response.error) {
            this.query.model = _.extend({}, response.query);
        }
        this.firstRun = true;

        this.query.workspace.trigger('query:result', {
            workspace: this.query.workspace,
            data: response
        });

    },

    hasRun: function() {
        return this.firstRun;
    },
    
    lastresult: function() {
            return this.result;
    },
    
    url: function() {
        //return encodeURI(this.query.url() + "/result/" + this.query.getProperty('formatter'));
        return "api/query/execute";
    }
});
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
 * Model which handles "special" actions against the query
 * Ex.: selections, swap axis, mdx
 */
var QueryAction = Backbone.Model.extend({
    initialize: function(args, options) {
        // Keep track of query
        this.query = options.query;

        // Set default url
        this.url = this.query.url;
    },

    gett: function(action, options) {
        this.handle("fetch", action, options);
    },

    post: function(action, options) {
        this.handle("save", action, options);
    },

    put: function(action, options) {
        this.id = _.uniqueId('queryaction_');
        this.handle("save", action, options);
        delete this.id;
    },

    del: function(action, options) {
        this.id = _.uniqueId('queryaction_');
        this.handle("delete", action, options);
        delete this.id;
    },

    // Call arbitrary actions against the query
    handle: function(method, action, options) {
        // Set query action
        this.url = this.query.url() + action;

		var id = this.id;
        // Clear out old attributes
        this.attributes = options.data? options.data : {};

        // Initiate action
        if (method == "save") {
            // Handle response from server
            //this.parse = options.success;

            this.save({}, options);
        } else if (method == "delete") {
			this.set("id", this.id);
            this.destroy(options);
        } else if (method == "fetch") {
            this.parse = function() {};
            this.fetch(options);
        }
    }
});
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
 
var QueryScenario = Backbone.Model.extend({
    initialize: function(args, options) {
        // Maintain `this`
        _.bindAll(this, "attach_listeners", "activate", "clicked_cell", "save_writeback", 
            "cancel_writeback", "check_input");
        
        this.query = options.query;
    },
    
    activate: function() {
        $(this.query.workspace.el).find("td.data").unbind('click').addClass('cellhighlight').click(this.clicked_cell);
    },

    attach_listeners: function(args) {
        if (args.workspace.query && args.workspace.query.properties &&
            args.workspace.query.properties.properties['org.saiku.connection.scenario'] === "true" &&
            $(args.workspace.el).find('.query_scenario').hasClass('on'))
        $(args.workspace.el).find("td.data").click(this.clicked_cell);
    },
    
    clicked_cell: function(event) {
        var $target = $(event.target).hasClass('data') ?
            $(event.target).find('div') : $(event.target);
        var value = $target.attr('alt');
        var pos = $target.attr('rel');
        
        var $input = $("<input type='text' value='" + value + "' />")
            .keyup(this.check_input)
            .blur(this.cancel_writeback);
        $target.html('').append($input);
        $input.focus();
    },
    
    check_input: function(event) {
        if (event.which == 13) {
            this.save_writeback(event);
        } else if (event.which == 27 || event.which == 9) {
            this.cancel_writeback(event);
        }
         
        return false;
    },
    
    save_writeback: function(event) {
        var $input = $(event.target).closest('input');
        this.set({
            value: $input.val(),
            position: $input.parent().attr('rel')
        });
        this.save();
        var value = $input.val();
        $input.parent().text(value);
    },
    
    cancel_writeback: function(event) {
        var $input = $(event.target).closest('input');
        $input.parent().text($input.parent().attr('alt'));
    },
    
    parse: function() {
        this.query.run();
    },

    url: function() {
        return this.query.url() + "/cell/" + this.get('position') + 
            "/" + this.get('value'); 
    }
});
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
 * Workspace query
 */
var Query = Backbone.Model.extend({

    formatter: Settings.CELLSET_FORMATTER,
    properties: null,

    initialize: function(args, options) {
        // Save cube
        _.extend(this, options);

        // Bind `this`
        _.bindAll(this, "run");

        // Generate a unique query id
        this.uuid = 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
            function (c) {
                var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }).toUpperCase();

        this.model = _.extend({ name: this.uuid }, SaikuOlapQueryTemplate);
        if (args.cube) {
            this.model.cube = args.cube;
        }
        this.helper = new SaikuOlapQueryHelper(this);

        // Initialize properties, action handler, and result handler
        this.action = new QueryAction({}, { query: this });
        this.result = new Result({ limit: Settings.RESULT_LIMIT }, { query: this });
        this.scenario = new QueryScenario({}, { query: this });
    },

    parse: function(response) {
        // Assign id so Backbone knows to PUT instead of POST
        this.id = this.uuid;
        if (response.name) {
            this.id = response.name;
            this.uuid = response.name;
        }
        this.model = _.extend(this.model, response);
        this.model.properties = _.extend({}, Settings.QUERY_PROPERTIES, this.model.properties);
    },

    setProperty: function(key, value) {
            this.model.properties[key] = value;
    },

    getProperty: function(key) {
        return this.model.properties[key];
    },

    run: function(force, mdx) {
        var self = this;
        // Check for automatic execution
        Saiku.ui.unblock();
        if (typeof this.model.properties != "undefined" && this.model.properties['saiku.olap.query.automatic_execution'] === false &&
			(force === false || force === undefined || force === null)) {
            return;
        }
        this.workspace.unblock();

        $(this.workspace.el).find(".workspace_results_info").empty();
        this.workspace.trigger('query:run');
        this.result.result = null;
        var validated = false;
        var errorMessage = '<span class="i18n">Query Validation failed!</span>';

        var exModel = this.helper.model();
		for(var k in this.attributes) {
			var att = this.attributes[k];
			if(k.substring(0,5)==="PARAM"){
				var p = k.substring(5, k.length);
				exModel.parameters[p] = att;
			}

		}
        if (exModel.queryType == "OLAP") {
            if (exModel.type == "QUERYMODEL") {
                var columnsOk = Object.keys(exModel.queryModel.axes.COLUMNS.hierarchies).length > 0;
                var rowsOk = Object.keys(exModel.queryModel.axes.ROWS.hierarchies).length > 0;
                var detailsOk = exModel.queryModel.details.axis == 'COLUMNS' && exModel.queryModel.details.measures.length > 0;
                if (!rowsOk || !columnsOk || !detailsOk) {
                    errorMessage = "";
                }
                if (!columnsOk && !detailsOk) {
                    errorMessage += '<span class="i18n">You need to include at least one measure or a level on columns for a valid query.</span>';
                }
                if(!rowsOk) {
                    errorMessage += '<span class="i18n">You need to include at least one level on rows for a valid query.</span>';

                }
                if ( (columnsOk || detailsOk) && rowsOk) {
                    validated = true;
                }

            } else if (exModel.type == "MDX") {
                validated = (exModel.mdx && exModel.mdx.length > 0);
                if (!validated) {
                    errorMessage = '<span class="i18n">You need to enter some MDX statement to execute.</span>';
                }
            }
        }
        if (!validated) {
            this.workspace.table.clearOut();
            $(this.workspace.processing).html(errorMessage).show();
            this.workspace.adjust();
            Saiku.i18n.translate();
            return;
        }


        // Run it
        this.workspace.table.clearOut();
        $(this.workspace.processing).html('<span class="processing_image">&nbsp;&nbsp;</span> <span class="i18n">Running query...</span> [&nbsp;<a class="cancel i18n" href="#cancel">Cancel</a>&nbsp;]').show();
        this.workspace.adjust();
        this.workspace.trigger('query:fetch');
		Saiku.i18n.translate();
        var message = '<span class="processing_image">&nbsp;&nbsp;</span> <span class="i18n">Running query...</span> [&nbsp;<a class="cancel i18n" href="#cancel">Cancel</a>&nbsp;]';
        this.workspace.block(message);
/*
        TODO: i wonder if we should clean up the model (name and captions etc.)
        delete this.model.queryModel.axes['FILTER'].name;
*/
        this.result.save({},{ contentType: "application/json", data: JSON.stringify(exModel), error: function() {
            Saiku.ui.unblock();
            var errorMessage = '<span class="i18n">Error executing query. Please check the server logs or contact your administrator!</span>';
            self.workspace.table.clearOut();
            $(self.workspace.processing).html(errorMessage).show();
            self.workspace.adjust();
            Saiku.i18n.translate();
        } });
    },

    enrich: function() {
        var self = this;
        this.workspace.query.action.post("/../enrich", {
            contentType: "application/json",
            data: JSON.stringify(self.model),
            async: false,
            success: function(response, model) {
                self.model = model;
            }
        });
    },

    url: function() {
        return "api/query/" + encodeURI(this.uuid);
    }
});


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
 * Object which handles authentication and stores connections and cubes
 * @param username
 * @param password
 * @returns {Session}
 */
var Session = Backbone.Model.extend({
    username: null,
    password: null,
    sessionid: null,
    upgradeTimeout: null,
    isAdmin: false,
    id: null,
    initialize: function(args, options) {
        // Attach a custom event bus to this model
        _.extend(this, Backbone.Events);
        _.bindAll(this, "check_session", "process_session", "load_session","login", "brute_force");
        // Check if credentials are being injected into session
        if (options && options.username && options.password) {
            this.username = options.username;
            this.password = options.password;
            if (!Settings.DEMO) {
                this.save({username:this.username, password:this.password},{success: this.check_session, error: this.check_session});
            } else {
                this.check_session();
            }

        } else {
            this.check_session();
        }
    },

    check_session: function() {
        if (this.sessionid === null || this.username === null || this.password === null) {
			var that = this;
            this.clear();
            this.fetch({ success: this.process_session, error: this.brute_force });
        } else {
            this.username = encodeURIComponent(options.username);
            this.load_session();
        }
    },

	/**
	 * This is a complete hack to get the BI platform plugin working.
	 * @param obj
	 */
	brute_force: function(model, response){
		this.clear();
		this.fetch({ success: this.process_session, error: this.show_error });
	},
	show_error: function(model, response){

		// Open form and retrieve credentials
		Saiku.ui.unblock();
		this.form = new SessionErrorModal({ issue: response.responseText });
		this.form.render().open();


	},

    load_session: function() {
        this.sessionworkspace = new SessionWorkspace();
    },

    process_session: function(model, response) {
        if ((response === null || response.sessionid == null)) {
            // Open form and retrieve credentials
            Saiku.ui.unblock();
            if (Settings.DEMO) {
                this.form = new DemoLoginForm({ session: this });
            } else {
                this.form = new LoginForm({ session: this });
            }
            this.form.render().open();
        } else {
            this.sessionid = response.sessionid;
            this.roles = response.roles;
            this.isAdmin = response.isadmin;
            this.username = encodeURIComponent(response.username);
            this.language = response.language;
            if (typeof this.language != "undefined" && this.language != Saiku.i18n.locale) {
                Saiku.i18n.locale = this.language;
                Saiku.i18n.automatic_i18n();
            }
                var license =new License();

                license.fetch_license('api/license/', function(opt) {
                    if (opt.status === 'success') {
                        Settings.LICENSE = opt.data.toJSON();
                    }
                    if(Saiku.session.isAdmin) {

                        var quota = new LicenseQuota();

                        quota.fetch_quota('api/license/quota', function (opt) {
                            if (opt.status === 'success') {
                                Settings.LICENSEQUOTA = opt.data.toJSON();
                            }
                        });
                    }

                });


            this.load_session();
        }

        return this;
    },

    error: function() {
        $(this.form.el).dialog('open');
    },

    login: function(username, password) {
        var that = this;
        this.save({username:username, password:password},{dataType: "text", success: this.check_session, error: function(model, response){
            that.login_failed(response.responseText);
        }});

    },
    login_failed: function(response){
        this.form = new LoginForm({ session: this });
        this.form.render().open();
        this.form.setError(response);
    },
    logout: function() {
        // FIXME - This is a hack (inherited from old UI)
        Saiku.ui.unblock();
        $('#header').empty().hide();
        $('#tab_panel').remove();
        Saiku.tabs = new TabSet();
        Saiku.toolbar.remove();
        Saiku.toolbar = new Toolbar();

        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.clear();
        }

        this.set('id', _.uniqueId('queryaction_'));
        this.destroy({async: false });

        this.clear();
        this.sessionid = null;
        this.username = null;
        this.password = null;
		this.roles = null;
        this.isAdmin = false;
        this.destroy({async: false });
        //console.log("REFRESH!");
        document.location.reload(false);
        delete this.id;

    },

    url: function() {

        return "session";
    }
});
/*
 * Copyright 2014 OSBI Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by bugg on 18/01/15.
 */

var SessionErrorModal = Modal.extend({
	initialize: function(args, options) {
		_.extend(this.options, {
			title: "Error"
			//issue: args.issue
		});

		this.reportedissue = args.issue;
		this.message = "There has been an error creating a session:<br>"+ this.reportedissue;
	},

	events: {
		'click a' : 'close'
	},

	dummy: function() { return true;},

	type: "info",

	//message: _.template("There has been an error creating a session:<br> this.reportedissue>"


});
/**
 * Created by bugg on 17/06/14.
 */
var SplashScreen = Backbone.View.extend({
    events: {
        'click .run_query': 'run_query',
        'click .run_dashboards': 'run_dashboard',
        'click .head' : 'click_head',
        'click .beg_tut': 'run_tour'
    },
    click_head: function(event){
        event.preventDefault();
        var target = event.target;
        var a = $(target).attr('class').split(' ');
        $('nav li').removeClass('active');
        $(target).parent().addClass('active');
        $('.stabs section').hide();

        var active = "";
        if(a.indexOf("welcome") > -1){
            active = "welcome";
        }
        else if(a.indexOf("features") > -1){
            active = "features";
        }
        else if(a.indexOf("help") > -1){
            active = "help";
        }
        else if(a.indexOf("enterprise") > -1){
            active = "enterprise";
        }

        $('#'+active).fadeIn();

    },
    run_tour: function(){

        this.toolbar = Saiku.toolbar;

        var tour = new Tour({toolbar: this.toolbar});

        tour.run_tour();
    },
    initialize: function(args) {
        _.bindAll(this, "caption");
        _.extend(this, Backbone.Events);




    },
    run_query : function(){
        Saiku.tabs.add(new Workspace());
        return false;
    },
    run_dashboard : function(){
        if(Saiku.Dashboards === undefined){
            alert("Please upgrade to Saiku Enterprise for Dashboards")
        }
        else {

            var tab = _.find(Saiku.tabs._tabs, function(tab) {
                return tab.content instanceof Dashboards;
            });

            if (tab) {
                tab.select();
            }
            else {
                Saiku.tabs.add(new Dashboards());
            }

            return false;
        }
        return false;
    },
    template: function() {
        var template = $("<div> <div id='splash'> <nav> <ul> <li class='active'><a class='welcome head'" +
                " href='#'>Welcome</a></li> <li><a class='features head' href='#'>Features</a></li> <li><a" +
                " class='help head' href='#'>Get Help</a></li> <li class='enterprisetoggle enterprise'><a" +
                " class='enterprise head'" +
                " href='#'>Enterprise</a></li> </ul> <h2>Explore Data. Visualise. Act.</h2> </nav> <section" +
                " class='stabs'> <section style='margin-top:50px;min-height:700px;' id='welcome'> <div" +
                " style='width:50%;float:left;'> <h1 class='saikulogo'>Saiku</h1> <p>Saiku has the power to change" +
                " the way you think about your business and make decisions.   Saiku provides powerful, web based" +
                " analytics for everyone in your organisation. Quickly and easily analyse data from any data  source" +
                " to discover what is really happening inside and outside your organisation. <i class='icon" +
            " icon-remove' style='"+
        "height: 100px;"+
        "'></i>  </p> <h2>Quick" +
                " Links</h2> <ul class='quicklinks'> <li><a class='run_query' href='#'>Create a new query</a></li>" +
                " <li><a href='#' title='Dashboards' class='run_dashboards'>Create a dashboard</a></li> <li> " +
                " <a href='http://saiku.meteorite.bi' target='_blank'>Visit the website</a></li> " +
                "<li><a href='#' class='help head'>Tutorials</a></li> </ul> " +
                "<p class='fixed'><a class='enterprisetoggle button' href='http://meteorite.bi' target='_blank'>Get Enterprise</a></p> " +
                "<h2>News</h2> <div id='news'></div> </div> <div style='width:40%;margin-left:10%;float:left;' id='dyn_content' class='enterprisetoggle'> " +
                "<h2>Discover more about Saiku</h2><p>Saiku Analytics provides both a Community Version and an Enterprise Version with added features. " +
                "To find out more you can <a href='http://meteorite.bo'>visit our website</a> or watch the videos on our " +
                "<a href='https://www.youtube.com/channel/UChivLeroOJx0_JamfuZ_XHA'>Youtube channel</a>.</p>" +
                "<p>If you are using Saiku Analytics in a business or commercial product, you can help give back in many ways. " +
                "Swing by our <a href='http://webchat.freenode.net/?channels=##saiku'IRC channel</a> and help foster the community, " +
                "join the <a href='http://community.meteorite.bi'>mailing lists</a> and ask/answer questions, <a href='http://meteorite.bi'>sponsor a new feature</a>, " +
                "or best of all <a href='http://www.meteorite.bi/saiku-pricing'>purchase an EE license</a>, which funds development of Saiku Community Edition " +
                "along with Enterprise Edition.</p><div></div> </div> </section> <section style='display:none !important;margin-top:50px' id='features'> " +
                "<h1 class='saikulogo'>Saiku</h1> <h2>Features</h2> <h3>Web Based Analysis</h3> " +
                "<p>Saiku provides the user with an entirely browser based experience. We support all modern browsers, and our user interface is 100% HTML and Javascript. " +
                "<br/>Saiku uses REST based communications, this allows the development of custom user interfaces and " +
                "facilitates the easy integration of the Saiku Server into other applications and services.</p> " +
                "<h3>Standards Compliant</h3> <p>Saiku is based upon the Microsoft MDX query language and will work on " +
                "most JDBC compliant data sources. We also provide a number of connectors to NOSQL data sources.</p>" +
                " <h3>Dynamic charting</h3> <p>Saiku uses a flexible charting engine to provide a wide range of charts and graphs. " +
                "These are all HTML & Javascript only and don't require flash to be installed on the computer.</p> " +
                "<h3>Pluggable visualisation engine</h3> <p>Saiku Enterprise boasts a fully pluggable visualisation engine. " +
                "This allows developers to build third party extensions and plug them into Saiku Enterprise to extend or " +
                "replace the existing visualisations.</p> </section> <section style='display:none !important;margin-top:50px' id='help'> " +
                "<h1 class='saikulogo'>Saiku</h1> " +
                "<h2>Help</h2> <p>We provide Training, Consulting and Support to ensure " +
                "you get the most from Saiku and your data. Our services cover all aspects of data analysis including data strategy, " +
                "design, architecture, deployment and application/software support.</p> <table style='margin-bottom:100px;'> <tr> " +
                "<th>Tutorials</th><th>Wiki</th> <th>Support</th> </tr> <tr><td>We have a number of click through" +
                " tutorials to help get your started: <ul><li><a href='#'  class='beg_tut'>Beginners(Query building" +
                " and" +
                " charts)</a></li></ul>" +
                " <td>Why" +
                " not try  our new <a" +
                " href='http://wiki.meteorite.bi' target='_blank'>Wiki site</a>" +
                "<br/>for community documentation.</td> <td>If you require more, <br/><a href='mailto:info@meteorite.bi'>contact us</a> for support!.</td> </tr> </table> </section>" +
                " <section style='display:none !important;margin-top:50px' id='enterprise'> <h1 class='saikulogo'>Saiku</h1> <h2>Enterprise</h2> <p>Saiku Enterprise is our fully supported and tested server and Pentaho plugin system. Buy Saiku Enterprise from as little as $15 per user per month and enjoy the addtional features Saiku Enterprise has to offer</p> <p>To find out more visit our <a href='http://meteorite.bi' target='_blank'>site</a> or <a href='mailto:info@meteorite.bi'>schedule a call</a> with one of us and we can show you why you should choose Saiku Enterprise!</p> </section> </section> </div> </div>").html() || "";
        return _.template(template)({
            //    cube_navigation: Saiku.session.sessionworkspace.cube_navigation
        });

    },
    setupPage: function(obj){
        var height = $(window).height();
        $('body').height(height);
        $('.stabs section').each(function(){
            var vH = $(this).height();
            var dif = ((height - vH)/2)-50;
            if(dif<0){
                dif = 20;
            }
            //$(this).css('margin-top',dif+'px').hide();
        });
        var active = $('nav li.active a').attr('class');
        $('#'+active).fadeIn();
    },
    render: function(){
        var self = this;

        var license = new License();
		if(Settings.BIPLUGIN5){
                $(self.el).html(self.template());

                if (Settings.LICENSE.licenseType != undefined &&
                    Settings.LICENSE.licenseType != "trial" && Settings.LICENSE.licenseType != "Open Source License") {

                    $(self.el).find(".enterprisetoggle").css("visibility", "hidden");


				}
                self.getContent();

                self.getNews();

                self.setupPage(self);
                $('#splash').find('> nav > ul > li.active > a').click(function(){
                    var active = $(this).attr('class');
                    $('nav li').removeClass('active');
                    $(this).parent().addClass('active');
                    $('.stabs section').hide();
                    $('#'+active).fadeIn();
                });
		}
		else {
                //$(self.el).html(self.template()).appendTo($('body'));
                $(self.el).html(self.template());

                if (Settings.LICENSE.licenseType != undefined &&
                    Settings.LICENSE.licenseType != "trial" && Settings.LICENSE.licenseType != "Open" +
                    " Source License") {

                    $(self.el).find(".enterprisetoggle").css("visibility", "hidden");


				}
                self.getContent();

                self.getNews();

                self.setupPage(self);
            $('#splash > nav > ul > li.active > a').click(function(){
                var active = $(this).attr('class');
                $('nav li').removeClass('active');
                $(this).parent().addClass('active');
                $('.stabs section').hide();
                $('#'+active).fadeIn();
            });

        }

      return this;
  },
    remove:function(){
        $(this.el).remove();
    },
    caption: function(increment) {
        return '<span class="i18n">Home</span>';
    },
	getNews: function(){
		var that = this;
		$.ajax({
			type: 'GET',
			url: "http://meteorite.bi/news.json",
			async: false,
			contentType: "application/json",
			dataType: 'jsonp',    
			jsonpCallback: 'jsonCallback',

			success: function(json) {
				for(var i = 0; i<json.item.length;i++){
					$(that.el).find("#news").append("<h4 style='margin-left: 0.5%;color:#6D6E71;'>"+json.item[i].title+"</h4><strong style='margin-left: 0.5%;color:#6D6E71;'>"+json.item[i].date+"</strong>" +
					"<br/><p style='color:#6D6E71;'>"+json.item[i].body+"</p>")
				}
			},
			error: function(e) {
				console.log(e.message);
			}
		});
	},
    getContent: function(){
        var that =this;
        var license = new License();

        $.ajax({
            type: 'GET',
            url: "http://meteorite.bi/content.json",
            async: false,
            contentType: "application/json",
            dataType: 'jsonp',
            jsonpCallback: 'jsonCallback2',
            cache: true,
            success: function(json) {

                $(that.el).find("#dyn_content").html(json.item[0].content);
                $(that.el).find(".responsive-container").fitVids();
                    //$(self.el).html(self.template()).appendTo($('body'));
                    $(self.el).html(that.template());

                    if (Settings.LICENSE.licenseType != "trial" && Settings.LICENSE.licenseType != "Open Source" +
                        " License") {

                        $(self.el).find(".enterprisetoggle").css("visibility", "hidden");


                    }

            },
            error: function(e) {

                    //$(self.el).html(self.template()).appendTo($('body'));
                    $(self.el).html(self.template());

                    if (Settings.LICENSE.licenseType != "trial" && Settings.LICENSE.licenseType != "Open Source" +
                        " License") {

                        $(self.el).find(".enterprisetoggle").css("visibility", "hidden");


                    }

            }
        });

    }

});
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
 * Object which handles sessionworkspace and stores connections and cubes
 * @param username
 * @param password
 * @returns {Session}
 */
var SessionWorkspace = Backbone.Model.extend({
        
    initialize: function(args, options) {
        // Attach a custom event bus to this model
        _.extend(this, Backbone.Events);
        _.bindAll(this, "process_datasources", "prefetch_dimensions");
        this.initialized = false;
        this.first = true;
        // Check expiration on localStorage
        if (typeof localStorage !== "undefined" && localStorage) {
            if (!Settings.LOCALSTORAGE_EXPIRATION || Settings.LOCALSTORAGE_EXPIRATION === 0) {
                localStorage.clear();
            }
            if (localStorage.getItem('expiration') && localStorage.getItem('expiration') <= (new Date()).getTime()) {
                localStorage.clear();
            } else if (!localStorage.getItem('saiku-version') || (localStorage.getItem('saiku-version') !== Settings.VERSION) ) {
                localStorage.clear();
                localStorage.setItem('saiku-version', Settings.VERSION);
            }
        }        
        Saiku.ui.block("Loading datasources....");
        this.fetch({success:this.process_datasources},{});
        
    },

    refresh: function() {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.clear();
        }

        this.clear();

        if(typeof localStorage !== "undefined" && localStorage) {
          localStorage.setItem('saiku-version', Settings.VERSION);  
        }

        this.fetch({success:this.process_datasources},{});
    },
        
    destroy: function() {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.clear();
        }
        return false;
    },
    render_default_tab: function(reports, oldworkspace){
        if(oldworkspace!=null){
            oldworkspace.unbind("report:rendered");
        }
        var that=this;
        for (var i = 0; i < reports.length; i++) {
            // if ((reports[i].visible && reports[i].visible !== 'false') || reports[i].visible === 'true') {
            if (reports[0].visible) {

                filePath = reports[0].path;
                if (filePath.indexOf('.saiku') === filePath.length - 6) {

                    Saiku.ui.block('Loading default report...');

                    fileName = filePath.replace(/^.*[\\\/]/, '');

                    var selectedQuery = new SavedQuery({file: filePath, name: fileName});
                    var item = {
                        fileType: 'saiku',
                        name: fileName.split('.saiku')[0]
                    };
                    var params = _.extend({
                        file: selectedQuery.get('file'),
                        formatter: Settings.CELLSET_FORMATTER
                    }, Settings.PARAMS);
                    var query = new Query(params, {name: selectedQuery.get('name')});
                    var workspace = new Workspace({query: query, item: item, viewState: null});
                    Saiku.tabs.add(workspace);
                    reports.shift();
                    workspace.bind('report:rendered', function(){
                        that.render_default_tab(reports);
                    });

                }
                else if (filePath.indexOf('.sdb') === filePath.length - 4) {
                    if (Saiku.Dashboards) {
                        Saiku.ui.block('Loading default report...');
                        Saiku.tabs.add(new DashboardViewTab({file: reports[i].path}));
                    }
                    else {
                        if (!Settings.INITIAL_QUERY && paramsURI.splash) {
                            Saiku.tabs.add(new SplashScreen());
                        }
                        else if (!Settings.INITIAL_QUERY) {
                            Saiku.tabs.add(new Workspace());
                        }
                    }
                }
                break;
            }
            else{
                reports.shift();
            }
        }
    },

    process_datasources: function(model, response) {
        // Save session in localStorage for other tabs to use
        if (typeof localStorage !== "undefined" && localStorage && localStorage.getItem('session') === null) {
            localStorage.setItem('session', JSON.stringify(response));

            // Set expiration on localStorage to one day in the future
            var expires = (new Date()).getTime() +  Settings.LOCALSTORAGE_EXPIRATION;
            if (typeof localStorage !== "undefined" && localStorage) {
                localStorage.setItem('expiration', expires);
            }
        }

        // Generate cube navigation for reuse
        this.cube_navigation = _.template($("#template-cubes").html())({
            connections: response
        });

        // Create cube objects
        this.cube = {};
        this.connections = response;
        _.delay(this.prefetch_dimensions, 20);

        if (!this.initialized) {
            // Show UI
            $(Saiku.toolbar.el).prependTo($("#header"));
            $("#header").show();
            Saiku.ui.unblock();
            // Add initial tab
            Saiku.tabs.render();

            // Notify the rest of the application that login was successful
            Saiku.events.trigger('session:new', {
                session: this
            });

            var paramsURI = Saiku.URLParams.paramsURI();

            if (!(_.has(paramsURI, 'splash'))) {
                paramsURI.splash = true;
            }
            else if (_.has(paramsURI, 'splash') && paramsURI.splash ||
                _.has(paramsURI, 'splash') && paramsURI.splash === null) {
                paramsURI.splash = true;
            }
            if(Settings.SPLASH==false){
               paramsURI.splash = false;
            }
            if (Settings.DEFAULT_REPORT_SHOW) {
                if (!Settings.INITIAL_QUERY && paramsURI.splash) {
                    Saiku.tabs.add(new SplashScreen());
                }
                else if(!Settings.INITIAL_QUERY) {
                    Saiku.tabs.add(new Workspace());
                }
                var globalreports = Settings.DEFAULT_REPORTS['_'];
                var rolereports = [];
                _.each(Saiku.session.roles, function(role){
                    var r = Settings.DEFAULT_REPORTS[role];
                    if(r!=undefined && r.length>0) {
                        rolereports = rolereports.concat(r);
                    }
                });
                var userreports = Settings.DEFAULT_REPORTS[Saiku.session.username];
                var everythingLoaded = 0;
                var that = this;
                var reports = globalreports.concat(userreports).concat(rolereports);
                function addDefaultReport() {
                    var filePath;
                    var fileName;

                    if (_.size(Settings.DEFAULT_REPORTS) > 0 && reports.length > 0) {
                        for (var i = 0; i < reports.length; i++) {
                            // if ((reports[i].visible && reports[i].visible !== 'false') || reports[i].visible === 'true') {
                            if (reports[0].visible) {

                                filePath = reports[0].path;
                                if (filePath.indexOf('.saiku') === filePath.length - 6) {

                                    Saiku.ui.block('Loading default report...');

                                    fileName = filePath.replace(/^.*[\\\/]/, '');

                                    var selectedQuery = new SavedQuery({ file: filePath, name: fileName });
                                    var item = {
                                        fileType: 'saiku',
                                        name: fileName.split('.saiku')[0]
                                    };
                                    var params = _.extend({
                                        file: selectedQuery.get('file'),
                                        formatter: Settings.CELLSET_FORMATTER
                                    }, Settings.PARAMS);
                                    var query = new Query(params, { name: selectedQuery.get('name') });
                                    var workspace = new Workspace({ query: query, item: item, viewState: null });
                                    Saiku.tabs.add(workspace);
                                    reports.shift();
                                    workspace.bind('report:rendered', function(){
                                        that.render_default_tab(reports, workspace);
                                    });

                                }
                                else if (filePath.indexOf('.sdb') === filePath.length - 4) {
                                    if (Saiku.Dashboards) {
                                        Saiku.ui.block('Loading default report...');
                                        Saiku.tabs.add(new DashboardViewTab({ file: reports[i].path }));
                                        reports.shift();
                                        that.render_default_tab(reports, null);

                                    }
                                    else {
                                        if (!Settings.INITIAL_QUERY && paramsURI.splash) {
                                            Saiku.tabs.add(new SplashScreen());
                                        }
                                        else if(!Settings.INITIAL_QUERY) {
                                            Saiku.tabs.add(new Workspace());
                                        }
                                    }
                                }
                                break;
                            }
                            else{
                                reports.shift();
                            }
                            /*else {
                             if (i === (reports.length - 1)) {
                             if (!Settings.INITIAL_QUERY && paramsURI.splash) {
                             Saiku.tabs.add(new SplashScreen());
                             }
                             else if(!Settings.INITIAL_QUERY) {
                             Saiku.tabs.add(new Workspace());
                             }
                             }
                             }*/
                        }
                    }
                    else {
                        if (!Settings.INITIAL_QUERY && paramsURI.splash) {
                            Saiku.tabs.add(new SplashScreen());
                        }
                        else if(!Settings.INITIAL_QUERY) {
                            Saiku.tabs.add(new Workspace());
                        }
                    }
                }

                everythingLoaded = setInterval(function() {
                    if (typeof window.DashboardViewTab !== 'undefined') {
                        clearInterval(everythingLoaded);
                        addDefaultReport();
                    }
                }, 100);
            }
            else {
                // Saiku.splash.render();
                if (!Settings.INITIAL_QUERY && paramsURI.splash) {
                    Saiku.tabs.add(new SplashScreen());
                }
                else if(!Settings.INITIAL_QUERY) {
                    Saiku.tabs.add(new Workspace());
                }
                //if (!Settings.INITIAL_QUERY) {
                //    Saiku.tabs.add(new Workspace());
                //} 
            }
        }
        else {
            if (!Settings.INITIAL_QUERY) {
                Saiku.tabs.add(new Workspace());
            }
        }
    },
    
    prefetch_dimensions: function() {        
        for(var i = 0, iLen = this.connections.length; i < iLen; i++) {
            var connection = this.connections[i];
            for(var j = 0, jLen = connection.catalogs.length; j < jLen; j++) {
                var catalog = connection.catalogs[j];
                for(var k = 0, kLen = catalog.schemas.length; k < kLen; k++) {
                    var schema = catalog.schemas[k];
                    for(var l = 0, lLen = schema.cubes.length; l < lLen; l++) {
                        var cube = schema.cubes[l];
                        var key = connection.name + "/" + catalog.name + "/" +
                            ((schema.name === "" || schema.name === null) ? "null" : schema.name) +
                            "/" + encodeURIComponent(cube.name);

                        if (typeof localStorage !== "undefined" && localStorage && 
                            localStorage.getItem("cube." + key) !== null) {
                            this.cube[key] = new Cube(JSON.parse(localStorage.getItem("cube." + key)));
                        } else {
                            this.cube[key] = new Cube({ key: key });
                            if (Settings.DIMENSION_PREFETCH === true) {
                                this.cube[key].fetch();
                            }
                        }
                    }
                }
            }
        }
        
        // Start routing
        if (!this.initialized && Backbone.history) {
            Backbone.history.start();
            this.initialized = true;
        }
    },
    
    url: function() {
        if (this.first) {
            this.first = false;
            return encodeURI(Saiku.session.username + "/discover");
        }
        else {
            return encodeURI(Saiku.session.username + "/discover/refresh");
        }
    }
});
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
 * Controls member selections
 */
var Member = Backbone.Model.extend({
    initialize: function(args, options) {
        this.cube = options.cube;
        var dimension = options.dimension.split("/");
        this.hierarchy = decodeURIComponent(dimension[0]);
        this.level = decodeURIComponent(dimension[1]);
    },
    
    url: function() {
        var url = encodeURI(Saiku.session.username + "/discover/") +
            this.cube + "/hierarchies/" + encodeURIComponent(this.hierarchy) + "/levels/" + encodeURIComponent(this.level);
        
        return url;
    }
});
var Plugin = Backbone.Model.extend({
   //urlRoot: Settings.REST_URL+'info'
});

var PluginCollection = Backbone.Collection.extend({
    model: Plugin,
    url: 'info'
});/*
 * Copyright 2014 OSBI Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var SettingsOverride = Backbone.Model.extend({
   //urlRoot: Settings.REST_URL+'info'
});

var SettingsOverrideCollection = Backbone.Collection.extend({
    model: SettingsOverride,
    url: 'info/ui-settings'
});/*
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
 * Model which fetches the information of license
 */
var License = Backbone.Model.extend({
	url: 'api/license',

	initialize: function() {
		_.bindAll(this, 'fetch_license');
	},

	fetch_license: function(path, callback) {
		this.fetch({
			success: function(res) {
				if (callback && typeof(callback) === 'function') {
					callback({status: 'success', data: res});
				}
			},
			error: function(err) {
				if (callback && typeof(callback) === 'function') {
					callback({status: 'error', data: err});
				}
			}
		});
	}
});

var LicenseUserModel = Backbone.Model.extend({
	url: 'api/license/users'
});

var LicenseUsersCollection = Backbone.Collection.extend({
	url: 'api/license/users',
    model: LicenseUserModel
});

var LicenseQuota = Backbone.Model.extend({
	url: 'api/license/quota',

	initialize: function() {
		_.bindAll(this, 'fetch_quota');
	},

	fetch_quota: function(path, callback) {
		this.fetch({
			success: function(res) {
				if (callback && typeof(callback) === 'function') {
					callback({status: 'success', data: res});
				}
			},
			error: function(err) {
				if (callback && typeof(callback) === 'function') {
					callback({status: 'error', data: err});
				}
			}
		});
	}
});/*
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
 * Central object for handling global application state
 */
var Saiku = {
    /**
     * View which manages toolbar interactions
     */
    toolbar: {},

    /**
     * View which handles tabs
     */
    tabs: new TabSet(),

    splash: new SplashScreen({toolbar: this.toolbar}),
    /**
     * Model which handles session and authentication
     */
    session: null,

    /**
     * Global event bus
     */
    events: _.extend({}, Backbone.Events),

    /**
     * Collection of routers for page fragments
     */
    routers: [],
    
    /**
     * Create a new variable for Leaflet interactive maps
     */
    leaflet: (typeof L !== 'undefined') ? L : {},

    /**
     * Convenience functions for blocking the UI
     */
    ui: {
        block: function(message) {
            $('.processing_message').html(message);
            $('.processing_message').removeClass("i18n_translated").addClass("i18n");
            Saiku.i18n.translate();

            $('.processing,.processing_container').show();
        },

        unblock: function() {
            $('.processing,.processing_container, .blockOverlay').hide();

            // Fix For Internet Explorer 10 UIBlock issue
            $('.blockUI').fadeOut('slow');
        }
    },
    log: function(channel, item) {
        if (console && console.log) {
            console.log("Logging for: " + channel);
            if (item) {
                console.log(item);
            }
        }
    },
    error: function(channel, item) {
        if (console && console.error) {
            console.error("Logging for: " + channel);
            console.error(item);
        }
    },
    URLParams: {
        buildValue: function(value) {
            if (/^\s*$/.test(value))           { return null; }
            if (/^(true|false)$/i.test(value)) { return value.toLowerCase() === 'true'; }
            if (isFinite(value))               { return parseFloat(value); }

            return value;
        },

        paramsURI: function() {
            var paramsURI = {},
                couples = window.location.search.substr(1).split('&'),
                lenCouples = couples.length,
                keyId,
                keyValue;

            if (window.location.search.length > 1) {
                for (keyId = 0; keyId < lenCouples; keyId++) {
                    keyValue = couples[keyId].split('=');
                    paramsURI[decodeURIComponent(keyValue[0])] = keyValue.length > 1 
                        ? this.buildValue(decodeURIComponent(keyValue[1])) 
                        : null;
                }
            }

            return paramsURI;
        },

        equals: function() {
            var params = Array.prototype.slice.call(arguments),
                paramsURI = this.paramsURI();

            if (_.isEqual(paramsURI, params[0])) {
                return true;
            }
            else {
                return false;
            }
        }
    },
    loadCSS: function(href, media) {
        var cssNode = window.document.createElement('link'),
            ref = window.document.getElementsByTagName('script')[0];

        cssNode.rel = 'stylesheet';
        cssNode.href = href;

        // Temporarily, set media to something non-matching to
        // ensure it'll fetch without blocking render
        cssNode.media = 'only x';

        // Inject link
        ref.parentNode.insertBefore(cssNode, ref);

        // Set media back to `all` so that the
        // stylesheet applies once it loads
        setTimeout(function() {
            cssNode.media = media || 'all';
        });

        return cssNode;
    },
    loadJS: function(src, callback) {
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
    },
    toPattern: function(value, opts) {
        var DIGIT = '9',
            ALPHA = 'A',
            ALPHANUM = 'S',
            output = (typeof opts === 'object' ? opts.pattern : opts).split(''),
            values = value.toString().replace(/[^0-9a-zA-Z]/g, ''),
            index = 0,
            len = output.length,
            i;

        for (i = 0; i < len; i++) {
            if (index >= values.length) {
                break;
            }
            if ((output[i] === DIGIT && values[index].match(/[0-9]/)) ||
                (output[i] === ALPHA && values[index].match(/[a-zA-Z]/)) ||
                (output[i] === ALPHANUM && values[index].match(/[0-9a-zA-Z]/))) {
                output[i] = values[index++];
            }
            else if (output[i] === DIGIT ||
                     output[i] === ALPHA ||
                     output[i] === ALPHANUM) {
                output = output.slice(0, i);
            }
        }

        return output.join('').substr(0, i);
    }
};

/**
 * Saiku Singleton pattern
 */
Saiku.singleton = (function() {
    'use strict';

    var instance;

    Saiku.singleton = function() {
        if (instance) {
            return instance;
        }

        instance = this;

        this.set = function(data) {
            this.data = data;
        };

        this.get = function() {
            return this.data;
        };
    };

    return Saiku.singleton;
}());

/**
 * Setting this option to true will fake PUT and DELETE requests
 * with a HTTP POST, and pass them under the _method parameter.
 * Setting this option will also set an X-HTTP-Method-Override header
 * with the true method. This is required for BI server integration
 */
Backbone.emulateHTTP = false;

/**
 * Up up and away!
 */
if (! Settings.BIPLUGIN) {
    $(document).ready(function () {
        var plugins = new PluginCollection();


            plugins.fetch({
                success: function () {
                    var settingsoverride = new SettingsOverrideCollection();

                    settingsoverride.fetch({
                        success: function () {
                            var i = plugins.size();
                            var j = 0;
                            plugins.each(function (log) {
                                j = j + 1;
                                if (log.attributes.path != "js/saiku/plugins/I18n/plugin.js") {
                                    jQuery.ajax({
                                        async: false,
                                        type: 'GET',
                                        url: log.attributes.path,
                                        data: null,
                                        success: function () {
                                            if (j == i) {

                                                var k = settingsoverride.size();
                                                var l = 0;
                                                settingsoverride.each(function (log) {
                                                    l = l + 1;

                                                    for (var key in log.attributes) {
                                                        Settings[key] = log.attributes[key];
                                                    }
                                                    if (Settings.CSS != undefined) {
                                                        Saiku.loadCSS(Settings.CSS, null)
                                                    }
                                                    if (k == l) {
                                                        Saiku.session = new Session({}, {
                                                            username: Settings.USERNAME,
                                                            password: Settings.PASSWORD
                                                        });

                                                        Saiku.toolbar = new Toolbar();
                                                    }
                                                });

                                            }
                                        },
                                        dataType: 'script'
                                    });
                                }
                                else {
                                    if (j == i) {

                                        var k = settingsoverride.size();
                                        var l = 0;
                                        settingsoverride.each(function (log) {
                                            l = l + 1;

                                            for (var key in log.attributes) {
                                                Settings[key] = log.attributes[key];
                                            }
                                            if (Settings.CSS != undefined) {
                                                Saiku.loadCSS(Settings.CSS, null)
                                            }
                                            if (k == l) {
                                                Saiku.session = new Session({}, {
                                                    username: Settings.USERNAME,
                                                    password: Settings.PASSWORD
                                                });

                                                    Saiku.toolbar = new Toolbar();
                                            }
                                        });

                                    }
                                }

                            });


                        },
                        error: function () {
                            var i = plugins.size();
                            var j = 0;
                            plugins.each(function (log) {
                                j = j + 1;
                                if (log.attributes.path != "js/saiku/plugins/I18n/plugin.js") {
                                    jQuery.ajax({
                                        async: false,
                                        type: 'GET',
                                        url: log.attributes.path,
                                        data: null,
                                        success: function () {
                                            if (j == i) {
                                                if (Settings.CSS != undefined) {
                                                    Saiku.loadCSS(Settings.CSS, null)
                                                }
                                                Saiku.session = new Session({}, {
                                                    username: Settings.USERNAME,
                                                    password: Settings.PASSWORD
                                                });

                                                Saiku.toolbar = new Toolbar();
                                            }
                                        },
                                        dataType: 'script'
                                    });
                                }
                                else {
                                    if (j == i) {

                                        if (Settings.CSS != undefined) {
                                            Saiku.loadCSS(Settings.CSS, null)
                                        }
                                        Saiku.session = new Session({}, {
                                            username: Settings.USERNAME,
                                            password: Settings.PASSWORD
                                        });

                                        Saiku.toolbar = new Toolbar();

                                    }
                                }
                            });

                        }
                    });
                }
            });
        });
}
/**
 * Dynamically load plugins!
 * @type {PluginCollection}
 */


var SaikuTimeLogger = function(element) {
    this._element = $(element);
    this._timestamps = [];
    this._events = [];
};

SaikuTimeLogger.prototype.log = function(eventname) {
    var time = (new Date()).getTime();
    if (!eventname) {
        eventname = "Unknown";
    }
    if (this._timestamps.length > 0) {
        var lastTime = this._timestamps[this._timestamps.length -1];
        if ((time - lastTime) > 1) {
            this._element.append( "<div>" + (time - lastTime) + " ms " + eventname + '  (previous: ' + this._events[this._events.length -1]  + " )</div>");
        }
    }
    this._timestamps.push(time);
    this._events.push(eventname);
};

/*
 *   Copyright 2015 OSBI Ltd
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
 * Dialog for date filter
 */
var DateFilterModal = Modal.extend({
	type: 'date-filter',

	buttons: [
		{ text: 'Clear', method: 'clear_date_filter' },
		{ text: 'Save', method: 'save' },
		{ text: 'Open Standard Filter', method: 'open_standard_filter' },
		{ text: 'Cancel', method: 'finished' },
        { text: 'Help', method: 'help' }
	],

	events: {
		'click a': 'call',
		'focus .selection-date'  : 'selection_date',
		'click .selection-radio' : 'disable_divselections',
		'click .operator-radio'  : 'show_fields',
		'click #add-date'        : 'add_selected_date',
		'click .del-date'        : 'del_selected_date'
	},

	template_days_mdx: 'Filter({parent}.Members, {parent}.CurrentMember.NAME {comparisonOperator} \'{dates}\'',

	template_many_years_mdx: ' {logicalOperator} {parent}.CurrentMember.NAME {comparisonOperator} \'{dates}\'',

	template_mdx: 'IIF(ISEMPTY(CurrentDateMember([{dimension}.{hierarchy}],' +
	' \'["{dimension}.{hierarchy}"]\\\.{analyzerDateFormat}\', EXACT)), {}, { {parent}' +
	' CurrentDateMember([{dimension}.{hierarchy}],' +
	' \'["{dimension}.{hierarchy}"]\\\.{analyzerDateFormat}\', EXACT)})',

	template_last_mdx: '{parent} LastPeriods({periodAmount}, CurrentDateMember([{dimension}.{hierarchy}], \'["{dimension}.{hierarchy}"]\\\.{analyzerDateFormat}\', EXACT))',

	template_dialog: _.template(
		'<div class="box-selections">' +
			'<div class="selection-option">' +
				'<input type="radio" class="selection-radio" name="selection-radio" id="selection-radio-operator" level-type="TIME_DAYS" disabled>' +
			'</div>' +
			'<div class="available-selections" selection-name="operator" available="false">' +
				'<span class="i18n">Operator:</span><br>' +
				'<div class="selection-options">' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-equals" value="=" data-operator="equals"> <span class="i18n">Equals</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-after" value=">" data-operator="after"> <span class="i18n">After</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-before" value="<" data-operator="before"> <span class="i18n">Before</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-between" value=">=|<=" data-operator="between"> <span class="i18n">Between</span></label><br>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-different" value="<>" data-operator="different"> <span class="i18n">Different</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-after-equals" value=">=" data-operator="after&equals"> <span class="i18n">After&amp;Equals</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-before-equals" value="<=" data-operator="before&equals"> <span class="i18n">Before&amp;Equals</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="operator-radio" class="operator-radio" id="op-notbetween" value=">=||<=" data-operator="notbetween"> <span class="i18n">Not Between</span></label><br>' +
					'</div>' +
					'<div class="inline-form-group">' +
						'<div class="form-group" id="div-selection-date" hidden>' +
							'<label class="i18n">Select a date:</label>' +
							'<input type="text" class="selection-date" id="selection-date" placeholder="Choose a date">' +
							'<a class="form_button i18n" id="add-date">add</a>' +
						'</div>' +
						'<div class="form-group" id="div-selected-date" hidden>' +
							'<fieldset>' +
								'<legend class="i18n">Selected date:</legend>' +
								'<ul id="selected-date"></ul>' +
							'</fieldset>' +
						'</div>' +
					'</div>' +
					'<div class="form-group" id="div-select-start-date" hidden>' +
						'<label class="i18n">Select a start date:</label>' +
						'<input type="text" class="selection-date" id="start-date" placeholder="Choose a date">' +
					'</div>' +
					'<div class="form-group" id="div-select-end-date" hidden>' +
						'<label class="i18n">Select an end date:</label>' +
						'<input type="text" class="selection-date" id="end-date" placeholder="Choose a date">' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="box-selections">' +
			'<div class="selection-option">' +
				'<input type="radio" class="selection-radio" name="selection-radio" id="selection-radio-fixed-date">' +
			'</div>' +
			'<div class="available-selections" selection-name="fixed-date" available="false">' +
				'<span class="i18n">Fixed Date:</span><br>' +
				'<div class="selection-options">' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="fixed-radio" id="fd-yesterday" data-leveltype="TIME_DAYS"> <span class="i18n">Yesterday</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="fixed-radio" id="fd-today" data-leveltype="TIME_DAYS"> <span class="i18n">Today</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="fixed-radio" id="fd-week" data-leveltype="TIME_WEEKS"> <span class="i18n">Current Week</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="fixed-radio" id="fd-month" data-leveltype="TIME_MONTHS"> <span class="i18n">Current Month</span></label>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="fixed-radio" id="fd-quarter" data-leveltype="TIME_QUARTERS"> <span class="i18n">Current Quarter</span></label><br>' +
					'</div>' +
					'<div class="form-group-selection">' +
						'<label><input type="radio" name="fixed-radio" id="fd-year" data-leveltype="TIME_YEARS"> <span class="i18n">Current Year</span></label>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="box-selections">' +
			'<div class="selection-option">' +
				'<input type="radio" class="selection-radio" name="selection-radio" id="selection-radio-available">' +
			'</div>' +
			'<div class="available-selections" selection-name="rolling-date" available="false">' +
				'<span class="i18n">Rolling Date:</span><br>' +
				'<div class="selection-options">' +
					'<div class="form-group-rolling">' +
						'<select>' +
							'<option class="i18n" value="last">Last</option>' +
							'<option class="keep-disabled i18n" value="next" disabled>Next</option>' +
						'</select>' +
					'</div>' +
					'<div class="form-group-rolling">' +
						'<input type="text" id="date-input">' +
					'</div>' +
					'<div class="form-group-rolling">' +
						'<select id="period-select">' +
							'<option name="TIME_DAYS" class="i18n" id="rd-days">Day(s)</option>' +
							'<option name="TIME_WEEKS" class="i18n" id="rd-weeks">Week(s)</option>' +
							'<option name="TIME_MONTHS" class="i18n" id="rd-months">Month(s)</option>' +
							'<option name="TIME_YEARS" class="i18n" id="rd-years">Year(s)</option>' +
						'</select>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>'
	),

	initialize: function(args) {
		// Initialize properties
		_.extend(this, args);
		this.options.title = 'Date Filter';
		this.message = 'Loading...';
		this.query = args.workspace.query;
		this.selectedDates = [];

		// Level information
		this.levelInfo = {
			cube: this.get_cube_name(),
			dimension: this.dimension,
			hierarchy: this.hierarchy,
			name: this.name
		};

		// Maintain `this` in callbacks
		_.bindAll(this, 'finished');

		// Resize when rendered
		this.bind('open', this.post_render);
		this.render();

		// show/hide button for clear filter
		if (this.show_button_clear()) {
			this.$el.find('.dialog_footer a:nth-child(1)').show();
			this.$el.find('.dialog_footer a:nth-child(3)').hide();
		}
		else {
			this.$el.find('.dialog_footer a:nth-child(1)').hide();
		}

		// Add function for button Close `x`
		this.$el.parent().find('.ui-dialog-titlebar-close').bind('click', this.finished);

		// Fetch available members
		this.member = new Member({}, {
			cube: this.workspace.selected_cube,
			dimension: this.key
		});

		// Load template
		this.$el.find('.dialog_body').html(this.template_dialog);

		// Disable all elements and remove an event handler
		this.$el.find('.available-selections *').prop('disabled', true).off('click');

		// Save data of levels
		this.dataLevels = this.save_data_levels();

		// Check SaikuDayFormatString in level
		this.check_saikuDayFormatString();

		// Initialize adding values
		this.add_values_fixed_date();
		this.add_values_last_periods();

		// Populate date filter
		this.populate();

		// Translate
		Saiku.i18n.translate();
	},

    help: function(event) {
        event.preventDefault();
        window.open('http://wiki.meteorite.bi/display/SAIK/Advanced+Date+Filtering');
    },

	open_standard_filter: function(event) {
		event.preventDefault();

    	// Launch selections dialog
    	(new SelectionsModal({
    		source: 'DateFilterModal',
		    target: this.target,
		    name: this.name,
		    key: this.key,
		    objDateFilter: {
		        dimension: this.dimension,
		        hierarchy: this.hierarchy,
		        data: this.data,
		        analyzerDateFormat: this.analyzerDateFormat,
		        dimHier: this.dimHier
		    },
		    workspace: this.workspace
		})).open();

		this.$el.dialog('destroy').remove();
	},

	post_render: function(args) {
		var left = ($(window).width() - 600) / 2,
			width = $(window).width() < 600 ? $(window).width() : 600;
		$(args.modal.el).parents('.ui-dialog')
			.css({ width: width, left: 'inherit', margin: '0', height: 490 })
			.offset({ left: left});
	},

	check_saikuDayFormatString: function() {
		var self = this;
		this.$el.find('.selection-radio').each(function(key, radio) {
			_.find(self.dataLevels, function(value) {
				if (self.name === value.name && value.saikuDayFormatString) {
					$(radio).prop('disabled', false);
				}
			});
		});
	},

	show_fields: function(event) {
		var $currentTarget = event.type ? $(event.currentTarget) : $(event),
			name = $currentTarget.data('operator');
		if (name !== undefined) {
			switch (name) {
			case 'equals':
			case 'different':
				$currentTarget.closest('.selection-options').find('#div-selection-date').show();
				$currentTarget.closest('.selection-options').find('#div-selected-date').show();
				$currentTarget.closest('.selection-options').find('#div-select-start-date').hide();
				$currentTarget.closest('.selection-options').find('#div-select-end-date').hide();
				$currentTarget.closest('.selection-options').find('#add-date').show();
				this.clear_operators();
				break;
			case 'after':
			case 'after&equals':
			case 'before':
			case 'before&equals':
				$currentTarget.closest('.selection-options').find('#div-selection-date').show();
				$currentTarget.closest('.selection-options').find('#div-selected-date').hide();
				$currentTarget.closest('.selection-options').find('#div-select-start-date').hide();
				$currentTarget.closest('.selection-options').find('#div-select-end-date').hide();
				$currentTarget.closest('.selection-options').find('#add-date').hide();
				this.clear_operators();
				break;
			case 'between':
			case 'notbetween':
				$currentTarget.closest('.selection-options').find('#div-selection-date').hide();
				$currentTarget.closest('.selection-options').find('#div-selected-date').hide();
				$currentTarget.closest('.selection-options').find('#div-select-start-date').show();
				$currentTarget.closest('.selection-options').find('#div-select-end-date').show();
				$currentTarget.closest('.selection-options').find('#add-date').hide();
				this.clear_operators();
				break;
			default:
				$currentTarget.closest('.selection-options').find('#div-selection-date').hide();
				$currentTarget.closest('.selection-options').find('#div-selected-date').hide();
				$currentTarget.closest('.selection-options').find('#div-select-start-date').hide();
				$currentTarget.closest('.selection-options').find('#div-select-end-date').hide();
				$currentTarget.closest('.selection-options').find('#add-date').hide();
				this.clear_operators();
			}
		}
		else {
			this.$el.find('.selection-options').find('#div-selection-date').hide();
			this.$el.find('.selection-options').find('#div-selected-date').hide();
			this.$el.find('.selection-options').find('#div-select-start-date').hide();
			this.$el.find('.selection-options').find('#div-select-end-date').hide();
			this.$el.find('.selection-options').find('#add-date').hide();
			this.clear_operators();
		}
	},

	save_data_levels: function() {
		var self = this,
			dataLevels = [];
		_.each(this.data.hierarchies.levels, function(value, key, list) {
			if (list[key].annotations.AnalyzerDateFormat !== undefined || list[key].annotations.SaikuDayFormatString !== undefined) {
				if (list[key].annotations.AnalyzerDateFormat !== undefined) {
					dataLevels.push({
						name: list[key].name,
						analyzerDateFormat: list[key].annotations.AnalyzerDateFormat.replace(/[.]/gi, '\\\.'),
						levelType: list[key].levelType,
						saikuDayFormatString: list[key].annotations.SaikuDayFormatString || ''
					});
				}
				else {
					dataLevels.push({
						name: list[key].name,
						analyzerDateFormat: '',
						levelType: list[key].levelType,
						saikuDayFormatString: list[key].annotations.SaikuDayFormatString || ''
					});
				}
				if (list[key].annotations.SaikuDayFormatString) {
					self.saikuDayFormatString = list[key].annotations.SaikuDayFormatString;
				}
			}
		});

		return dataLevels;
	},

	add_values_fixed_date: function() {
		var self = this;
		this.$el.find('.available-selections').each(function(key, selection) {
			if ($(selection).attr('selection-name') === 'fixed-date') {
				$(selection).find('input:radio').each(function(key, radio) {
					var name = $(radio).data('leveltype');
					_.find(self.dataLevels, function(value, key) {
						if (name === value.levelType) {
							$(radio).val(self.dataLevels[key].analyzerDateFormat);
						}
						else if ((name === 'yesterday' || name === 'today') &&
							value.name === self.name &&
							!(_.isEmpty(self.dataLevels[key].analyzerDateFormat)) &&
							self.dataLevels[key].analyzerDateFormat !== undefined &&
							self.dataLevels[key].analyzerDateFormat !== null &&
							self.dataLevels[key].levelType === 'TIME_DAYS') {
							$(radio).val(self.dataLevels[key].analyzerDateFormat);
						}
					});
				});

				$(selection).find('input:radio').each(function(key, radio) {
					if ($(radio).val() === null ||
						$(radio).val() === undefined ||
						$(radio).val() === '' ||
						$(radio).val() === 'on') {
						$(radio).addClass('keep-disabled');
					}
				});

			}
		});
	},

	add_values_last_periods: function() {
		var self = this;
		this.$el.find('.available-selections').each(function(key, selection) {
			if ($(selection).attr('selection-name') === 'rolling-date') {
				$(selection).find('#period-select > option').each(function(key, radio) {
					var name = $(radio).attr('name');
					_.find(self.dataLevels, function(value, key) {
						if (name === value.levelType) {
							$(radio).val(self.dataLevels[key].analyzerDateFormat);
						}

					});
				});
				$(selection).find('#period-select > option').each(function(key, radio) {
					if ($(radio).attr('value') === null ||
						$(radio).attr('value') === undefined ||
						$(radio).attr('value') === '') {
						$(radio).addClass('keep-disabled');
					}
				});
			}
		});
	},

	selection_date: function(event) {
		var $currentTarget = $(event.currentTarget),
			dateFormat = this.saikuDayFormatString.replace(/yyyy/gi, 'yy');
		$currentTarget.datepicker({
			dateFormat: dateFormat
		});
	},

	clear_selections: function(event) {
		// Clear dialog
		this.show_fields(event);
		this.$el.find('input[type="text"]').val('');
		this.$el.find('select').prop('selectedIndex', 0);
		this.$el.find('#selected-date').empty();
		this.$el.find('.available-selections *').prop('checked', false);
		// Clear variables
		this.selectedDates = [];
	},

	clear_operators: function() {
		// Clear operator
		this.$el.find('input[type="text"]').val('');
		this.$el.find('#selected-date').empty();
		// Clear variables
		this.selectedDates = [];
	},

	disable_divselections: function(event) {
		var params = Array.prototype.slice.call(arguments),
			$currentTarget = event.type ? $(event.currentTarget) : $(event);

		if (!params[1]) {
			this.clear_selections(event);
		}

		this.$el.find('.available-selections').attr('available', false);
		this.$el.find('.available-selections *').prop('disabled', true).off('click');
		$currentTarget.closest('.box-selections').find('.available-selections').attr('available', true);
		$currentTarget.closest('.box-selections').find('.available-selections *:not(.keep-disabled)')
			.prop('disabled', false).on('click');

		if (event.type) {
			$currentTarget.closest('.box-selections').find('select').each(function(key, selection) {
				$(selection).find('option:not([disabled])').first().attr('selected', 'selected');
			});
		}
	},

	day_format_string: function() {
		var dayFormatString = this.saikuDayFormatString;
		dayFormatString = dayFormatString.replace(/[a-zA-Z]/gi, '9');
		return dayFormatString;
	},

	add_selected_date: function(event) {
		event.preventDefault();
		var $currentTarget = $(event.currentTarget),
			dayFormatString = this.day_format_string(),
			sDate = this.$el.find('#selection-date'),
			selectedDate = $currentTarget.closest('.inline-form-group')
				.find('#div-selected-date').find('#selected-date');

		if (sDate.val() !== '') {
			var newDate = Saiku.toPattern(sDate.val(), dayFormatString);
			sDate.css('border', '1px solid #ccc');
			selectedDate.append($('<li></li>')
				.text(newDate)
				.append('<a href="#" class="del-date" data-date="' + newDate + '">x</a>'));
			this.selectedDates.push(newDate);
		}
		else {
			sDate.css('border', '1px solid red');
		}

		sDate.val('');
	},

	del_selected_date: function(event) {
		event.preventDefault();
		var $currentTarget = $(event.currentTarget),
			date = $currentTarget.data('date');
		this.selectedDates = _.without(this.selectedDates, date);
		$currentTarget.parent().remove();
	},

	populate: function() {
		var data = this.get_date_filter(),
			$selection;

		if (data && !(_.isEmpty(data))) {
			if (data.type === 'operator') {
				var $checked = this.$el.find('#' + data.checked),
					name = $checked.data('operator'),
					self = this;
				$selection = this.$el.find('#selection-radio-operator');
				$selection.prop('checked', true);
				$checked.prop('checked', true);
				this.disable_divselections($selection, true);
				this.show_fields($checked);

				this.selectedDates = data.values;

				if (name === 'after' || name === 'after&equals' ||
					name === 'before' || name === 'before&equals') {
					this.$el.find('#selection-date').val(this.selectedDates[0]);
				}
				else if (name === 'between') {
					self.$el.find('#start-date').val(this.selectedDates[0]);
					self.$el.find('#end-date').val(this.selectedDates[1]);
				}
				else if (name === 'notbetween') {
					self.$el.find('#start-date').val(this.selectedDates[0]);
					self.$el.find('#end-date').val(this.selectedDates[1]);
				}
				else {
					_.each(this.selectedDates, function(value, key) {
						self.$el.find('#selected-date').append($('<li></li>')
							.text(value)
							.append('<a href="#" class="del-date" data-date="' + value + '">x</a>'));
					});
				}
			}
			else if (data.type === 'fixed-date') {
				$selection = this.$el.find('#selection-radio-fixed-date');
				$selection.prop('checked', true);
				this.$el.find('#' + data.checked).prop('checked', true);
				this.disable_divselections($selection, true);
			}
			else {
				$selection = this.$el.find('#selection-radio-available');
				$selection.prop('checked', true);
				this.$el.find('#date-input').val(data.periodAmount);
				this.$el.find('select#period-select option[id="' + data.periodSelect + '"]').prop('selected', true);
				this.disable_divselections($selection, true);
			}
		}
	},

	populate_mdx: function(logExp, fixedDateName, periodAmount) {
		logExp.tagdim = logExp.dimension.replace(/m/g, '\\m').replace(/y/g, '\\y').replace(/q/g, '\\q').replace(/d/g, '\\d');
		logExp.taghier = logExp.hierarchy.replace(/m/g, '\\m').replace(/y/g, '\\y').replace(/q/g, '\\q').replace(/d/g, '\\d');

		if ((logExp.workinglevel !== logExp.level) && logExp.workinglevel !== undefined) {
			logExp.parent = '[{dimension}.{hierarchy}].[{level}].members,';
			logExp.parent = logExp.parent.replace(/{(\w+)}/g, function(m, p) {
				return logExp[p];
			});
		}
		else{
			logExp.parent = '';
		}

		this.template_mdx = this.template_mdx.replace(/{(\w+)}/g, function(m, p) {
			return logExp[p];
		});

		if (fixedDateName === 'dayperiods') {
			logExp.parent = '[{dimension}.{hierarchy}].[{level}]';
			logExp.parent = logExp.parent.replace(/{(\w+)}/g, function(m, p) {
				return logExp[p];
			});

			if (this.selectedDates.length > 1) {
				var len = this.selectedDates.length,
					i;

				for (i = 0; i < len; i++) {
					logExp.dates = this.selectedDates[i];

					if (logExp.comparisonOperator === '>=|<=') {
						if (i === 0) {
							logExp.comparisonOperator = logExp.comparisonOperator.split('|')[0];
							this.template_days_mdx = this.template_days_mdx.replace(/{(\w+)}/g, function(m, p) {
								return logExp[p];
							});
							logExp.comparisonOperator = '>=|<=';
						}
						else {
							logExp.logicalOperator = 'AND';
							logExp.comparisonOperator = logExp.comparisonOperator.split('|')[1];
							this.template_days_mdx += this.template_many_years_mdx.replace(/{(\w+)}/g, function(m, p) {
								return logExp[p];
							});
						}
					}
					else if (logExp.comparisonOperator === '>=||<=') {
						if (i === 0) {
							this.template_days_mdx = 'EXCEPT({parent}.Members, ' + this.template_days_mdx;

							logExp.comparisonOperator = logExp.comparisonOperator.split('||')[0];
							this.template_days_mdx = this.template_days_mdx.replace(/{(\w+)}/g, function(m, p) {
								return logExp[p];
							});
							logExp.comparisonOperator = '>=||<=';
						}
						else {
							logExp.logicalOperator = 'AND';
							logExp.comparisonOperator = logExp.comparisonOperator.split('||')[1];
							this.template_days_mdx += this.template_many_years_mdx.replace(/{(\w+)}/g, function(m, p) {
								return logExp[p];
							});

							return this.template_days_mdx + '))';
						}
					}
					else {
						if (i === 0) {
							this.template_days_mdx = this.template_days_mdx.replace(/{(\w+)}/g, function(m, p) {
								return logExp[p];
							});
						}
						else {
							if (logExp.comparisonOperator === '<>') {
								logExp.logicalOperator = 'AND';
							}
							else {
								logExp.logicalOperator = 'OR';
							}
							this.template_days_mdx += this.template_many_years_mdx.replace(/{(\w+)}/g, function(m, p) {
								return logExp[p];
							});
						}
					}
				}

				return this.template_days_mdx + ')';
			}
			else {
				logExp.dates = this.selectedDates[0];
				this.template_days_mdx = this.template_days_mdx.replace(/{(\w+)}/g, function(m, p) {
					return logExp[p];
				}) + ')';

				return this.template_days_mdx;
			}
		}
		else if (fixedDateName === 'lastperiods') {
			this.template_last_mdx = this.template_last_mdx.replace(/{(\w+)}/g, function(m, p) {
				return logExp[p];
			});

			return this.template_last_mdx;
		}
		else if (fixedDateName !== 'yesterday') {
			return this.template_mdx;
		}
		else {
			return this.template_mdx + '.lag(1)';
		}
	},

	save: function(event) {
		event.preventDefault();
		// Notify user that updates are in progress
		var $loading = $('<div>Saving...</div>');
		$(this.el).find('.dialog_body').children().hide();
		$(this.el).find('.dialog_body').prepend($loading);

		var self = this,
			fixedDateName,
			comparisonOperator,
			analyzerDateFormat,
			periodAmount,
			parentmembers,
			mdx = null,
			selectedData = {};

		if (self.hierarchy === null || self.hierarchy === undefined) {
			self.hierarchy = self.dimension;
		}

		this.$el.find('.available-selections').each(function(key, selection) {
			if ($(selection).attr('available') === 'true') {
				selectedData.type = $(selection).attr('selection-name');

				if ($(selection).attr('selection-name') === 'operator') {
					$(selection).find('input:radio').each(function (key, radio) {
						if ($(radio).is(':checked') === true) {
							var name = $(radio).data('operator');
							selectedData.checked = $(radio).attr('id');

							if (name === 'after' || name === 'after&equals' ||
								name === 'before' || name === 'before&equals') {
								self.selectedDates = [];
								self.selectedDates.push(self.$el.find('#selection-date').val());
							}
							else if (name === 'between' || name === 'notbetween') {
								self.selectedDates = [];
								self.selectedDates.push(self.$el.find('#start-date').val());
								self.selectedDates.push(self.$el.find('#end-date').val());
							}

							parentmembers = self.name;
							fixedDateName = 'dayperiods';
							comparisonOperator = $(radio).val();
							selectedData.values = self.selectedDates;
						}
					});
				}
				else if ($(selection).attr('selection-name') === 'fixed-date') {
					$(selection).find('input:radio').each(function (key, radio) {
						if ($(radio).is(':checked') === true) {
							fixedDateName = $(radio).attr('id').split('-')[1];
							analyzerDateFormat = $(radio).val();
							selectedData.checked = $(radio).attr('id');
						}
					});
				}
				else if ($(selection).attr('selection-name') === 'rolling-date') {
					analyzerDateFormat = $('#period-select').find(':selected').val();
					fixedDateName = 'lastperiods';
					periodAmount = $(selection).find('input:text').val();
					selectedData.fixedDateName = fixedDateName;
					selectedData.periodAmount = $(selection).find('input:text').val();
					selectedData.periodSelect = $('#period-select').find(':selected').attr('id');
				}

				var len = self.dataLevels.length,
					workinglevel,
					i;

				for (i = 0; i < len; i++) {
					if (self.dataLevels[i].analyzerDateFormat === analyzerDateFormat) {
						if (self.dataLevels[i].name === self.name) {
							parentmembers = self.name;
							workinglevel = self.dataLevels[i].name;
						}
						else {
							workinglevel = self.dataLevels[i].name;
						}
					}
				}

				var logExp = {
					dimension: self.dimension,
					hierarchy: self.hierarchy,
					level: self.name,
					analyzerDateFormat: analyzerDateFormat,
					periodAmount: periodAmount,
					comparisonOperator: comparisonOperator,
					workinglevel: workinglevel
				};

				//if (fixedDateName === 'dayperiods' || (logExp.workinglevel !== logExp.level && logExp.workinglevel !== undefined)) {
					if ((fixedDateName === 'dayperiods' && self.selectedDates[0] !== '' && self.selectedDates[0] !== undefined) ||
						(fixedDateName === 'lastperiods' && !(_.isEmpty(analyzerDateFormat)) && analyzerDateFormat !== 'Day(s)' && !(_.isEmpty(periodAmount))) ||
						(fixedDateName !== 'dayperiods' && fixedDateName !== 'lastperiods') && !(_.isEmpty(analyzerDateFormat))) {
						mdx = self.populate_mdx(logExp, fixedDateName);
					}
					else {
						mdx = null;
					}
				/*}
				else {
					mdx = null;
				}*/
			}
		});

		var hName = decodeURIComponent(this.member.hierarchy),
			lName = decodeURIComponent(this.member.level),
			hierarchy = this.workspace.query.helper.getHierarchy(hName),
			cubeSelected = this.get_cube_name();

		_.extend(selectedData, this.levelInfo);

		if ((fixedDateName === 'dayperiods' && this.selectedDates[0] !== '' && self.selectedDates[0] !== undefined) ||
			(fixedDateName === 'lastperiods' && !(_.isEmpty(analyzerDateFormat)) && analyzerDateFormat !== 'Day(s)' && !(_.isEmpty(periodAmount))) ||
			(fixedDateName !== 'dayperiods' && fixedDateName !== 'lastperiods') && !(_.isEmpty(analyzerDateFormat))) {
			this.set_date_filter(selectedData);
		}
		else {
			var uuid = this.get_uuid(selectedData);
			this.workspace.dateFilter.remove(uuid);
			this.workspace.query.setProperty('saiku.ui.datefilter.data', this.workspace.dateFilter.toJSON());
		}

		// console.log(mdx);

		if (hierarchy && hierarchy.levels.hasOwnProperty(lName)) {
			hierarchy.levels[lName] = { mdx: mdx, name: lName };
		}

		this.finished();
	},

	get_cube_name: function() {
		return decodeURIComponent(this.workspace.selected_cube.split('/')[3]);
	},

	get_uuid: function(data) {
		return '[' + data.cube + '].' + this.dimHier + '.[' + data.name + ']';
	},

	set_date_filter: function(data) {
		var dateFilter = this.workspace.dateFilter,
			objDateFilter = dateFilter.toJSON(),
			uuid = this.get_uuid(data);

		data.id = uuid;
		data.key = this.key;

		if (objDateFilter && !(_.isEmpty(objDateFilter))) {
			if (dateFilter.get(uuid)) {
				dateFilter = dateFilter.get(uuid);
				dateFilter.set(data);
				this.workspace.query.setProperty('saiku.ui.datefilter.data', dateFilter.toJSON());
			}
			else {
				dateFilter.add(data);
				this.workspace.query.setProperty('saiku.ui.datefilter.data', dateFilter.toJSON());
			}
		}
		else {
			dateFilter.add(data);
			this.workspace.query.setProperty('saiku.ui.datefilter.data', dateFilter.toJSON());
		}
	},

	get_date_filter: function() {
		var objData = {
			cube: this.get_cube_name(),
			dimension: this.dimension,
			hierarchy: this.hierarchy,
			name: this.name
		};

		var uuid = this.get_uuid(objData),
			data = this.workspace.dateFilter.get(uuid);

		data = data ? data.toJSON() : [];

		return data;
	},

    clear_date_filter: function(event) {
    	event.preventDefault();

		var objDateFilter = this.workspace.dateFilter.toJSON(),
			uuid;

		uuid = this.get_uuid(this.levelInfo);

		var hName = decodeURIComponent(this.member.hierarchy),
			lName = decodeURIComponent(this.member.level),
			hierarchy = this.workspace.query.helper.getHierarchy(hName);

		if (hierarchy && hierarchy.levels.hasOwnProperty(lName)) {
			hierarchy.levels[lName] = { mdx: null, name: lName };
		}

		this.workspace.dateFilter.remove(uuid);

		this.workspace.query.setProperty('saiku.ui.datefilter.data', this.workspace.dateFilter.toJSON());

		this.clear_selections(event);

		this.finished();
    },

    show_button_clear: function() {
		var dateFilter = this.workspace.dateFilter,
			objDateFilter = dateFilter.toJSON(),
			uuid;

		uuid = this.get_uuid(this.levelInfo);

        if (objDateFilter && !(_.isEmpty(objDateFilter))) {
            if (dateFilter.get(uuid)) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    },

	finished: function(event) {
		this.$el.dialog('destroy').remove();
		if (!event) {
			this.query.run();
		}
	}
});

/**
 * Observer to remove elements in the date filter model
 */
var DateFilterObserver = Backbone.View.extend({
	initialize: function(args) {
		// Keep track of parent workspace
		this.workspace = args.workspace;

		// Maintain `this` in callbacks
		_.bindAll(this, 'receive_data', 'workspace_levels');

		// Listen to result event
		this.workspace.bind('query:result', this.receive_data);
		Saiku.session.bind('dimensionList:select_dimension', this.receive_data);
		Saiku.session.bind('workspaceDropZone:select_dimension', this.receive_data);
		Saiku.session.bind('workspaceDropZone:clear_axis', this.receive_data);
	},

    receive_data: function(args) {
		var objDateFilter = this.workspace.dateFilter.toJSON();

		this.check_dateFilter_saved();

		if (objDateFilter && !(_.isEmpty(objDateFilter))) {
        	return _.delay(this.workspace_levels, 1000, args);
        }
    },

	get_cube_name: function() {
		return decodeURIComponent(this.workspace.selected_cube.split('/')[3]);
	},

    workspace_levels: function(args) {
    	var cubeName = this.get_cube_name(),
    		axisColumns = this.workspace.query.helper.getAxis('COLUMNS'),
    		axisRows = this.workspace.query.helper.getAxis('ROWS'),
    		axisFilter = this.workspace.query.helper.getAxis('FILTER'),
    		arrData = [];

    	if (axisColumns.location === 'COLUMNS' && axisColumns.hierarchies.length > 0) {
    		arrData.push(this.get_axes(cubeName, axisColumns));
    	}
    	if (axisRows.location === 'ROWS' && axisRows.hierarchies.length > 0) {
			arrData.push(this.get_axes(cubeName, axisRows));
    	}
    	if (axisFilter.location === 'FILTER' && axisFilter.hierarchies.length > 0) {
			arrData.push(this.get_axes(cubeName, axisFilter));
    	}

    	arrData = _.compact(_.union(arrData[0], arrData[1], arrData[2]));

    	this.check_dateFilter_model(arrData);
    },

    get_axes: function(cubeName, axis) {
    	var arrAxis = [],
    		len = axis.hierarchies.length,
    		i;

		for (i = 0; i < len; i++) {
			for (var name in axis.hierarchies[i].levels) {
				if (axis.hierarchies[i].levels.hasOwnProperty(name)) {
					arrAxis.push('[' + cubeName + '].' + axis.hierarchies[i].name + '.[' + name + ']');
				}
			}
		}

		return arrAxis;
    },

	check_dateFilter_saved: function() {
		var checkDateFilterSaved = this.workspace.checkDateFilterSaved;

		if ((this.workspace.item && !(_.isEmpty(this.workspace.item))) &&
			checkDateFilterSaved === undefined) {
			var data = this.workspace.query.getProperty('saiku.ui.datefilter.data');
			this.workspace.dateFilter.add(data);
			this.workspace.checkDateFilterSaved = true;
		}
		else {
			this.workspace.checkDateFilterSaved = true;
		}
	},

    check_dateFilter_model: function(data) {
    	var arrRemove = [],
    		arrChecked = [],
    		objDateFilter = this.workspace.dateFilter.toJSON(),
    		lenDateFilter = objDateFilter.length,
    		lenData = data.length,
    		aux = 0,
    		i = 0;

    	if (lenData > 0 && (objDateFilter && !(_.isEmpty(objDateFilter)))) {
    		while (i < lenData) {
	    		if (data[i] === objDateFilter[aux].id) {
	    			arrChecked.push(objDateFilter[aux].id);
	    			if ((aux + 1) < lenDateFilter) {
	    				aux++;
	    			}
	    			else {
	    				aux = 0;
	    				i++;
	    			}
	    		}
	    		else {
	    			arrRemove.push(objDateFilter[aux].id);
	    			if ((aux + 1) < lenDateFilter) {
	    				aux++;
	    			}
	    			else {
	    				aux = 0;
	    				i++;
	    			}
	    		}
    		}
		}
		else if (lenData === 0 && (objDateFilter && !(_.isEmpty(objDateFilter)))) {
			for (var j = 0; j < lenDateFilter; j++) {
				this.workspace.dateFilter.remove(objDateFilter[j].id);
			}

			this.workspace.query.setProperty('saiku.ui.datefilter.data', this.workspace.dateFilter.toJSON());
		}

		this.remove_dateFilter_model(_.difference(arrRemove, arrChecked));
    },

    remove_dateFilter_model: function(data) {
    	var lenData = data.length,
    		i;

    	for (i = 0; i < lenData; i++) {
    		this.workspace.dateFilter.remove(data[i]);
    	}

    	this.workspace.query.setProperty('saiku.ui.datefilter.data', this.workspace.dateFilter.toJSON());
    }
});

 /**
  * Start DateFilterObserver
  */
Saiku.events.bind('session:new', function() {

	function new_workspace(args) {
		if (typeof args.workspace.dateFilterObserver === 'undefined') {
			args.workspace.dateFilterObserver = new DateFilterObserver({ workspace: args.workspace });
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
/*
 * Copyright 2014 OSBI Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The "about us" dialog
 */
var WarningModal = Modal.extend({
    type: 'info',

    buttons: [
        { text: 'Okay', method: 'okay' },
        { text: 'Cancel', method: 'close' }
    ],
    /*message: Settings.VERSION + '<br>' +
        '<a href="http://saiku.meteorite.bi" target="_blank">http://saiku.meteorite.bi</a><br><br>' +
        'Powered by <img src="images/src/meteorite_free.png" width="20px"> <a href="http://www.meteorite.bi/consulting/" target="_blank">www.meteorite.bi</a>',*/

    initialize: function(args) {
        this.options.title = args.title;
        this.message = '<span class="i18n">' + args.message + '</span>';
        this.cancelfunction = args.cancel;
        this.okayfunction = args.okay;
        this.okaycallbackobject = args.okayobj;
        this.cancelcallbackobject = args.cancelobj;
    },

    close: function(event) {
        if (event.target.hash === '#close') {
            event.preventDefault();
        }
        if(this.cancelfunction != null) {
            this.cancelfunction(this.cancelcallbackobject);
        }
        this.$el.dialog('destroy').remove();
    },

    okay: function(event) {
        event.preventDefault();
        if(this.okayfunction!=null) {
            this.okayfunction(this.okaycallbackobject);
        }

        this.$el.dialog('destroy').remove();
    }

});
/*
 * Copyright 2014 OSBI Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The "about us" dialog
 */
var TitlesModal = Modal.extend({
    type: 'info',

    buttons: [
        { text: 'Okay', method: 'okay' },
        { text: 'Cancel', method: 'close' }
    ],

    message: _.template("<form id='login_form'>" +
        "<label for='title' class='i18n'>Title</label>" +
        "<input type='text' id='title' name='title' value='' />" +
        "<label for='variable' class='i18n'>Variable</label>" +
        "<input type='text' id='variable' name='variable' value='' />" +
        "<label for='explanation' class='i18n'>Explanation</label>" +
        "<input type='text' id='explanation' name='explanation' value='' />" +
        "</form>")(),

    initialize: function(args) {
        this.options.title = 'Report Titles';
        this.query = args.query;
    },

    close: function(event) {
        if (event.target.hash === '#close') {
            event.preventDefault();
        }

        this.$el.dialog('destroy').remove();
    },

    okay: function(event) {
        event.preventDefault();
        var headings ={title: $(this.el).find("#title").val(),
            variable: $(this.el).find("#variable").val(),
            explanation: $(this.el).find("#explanation").val()};
        var j = JSON.stringify(headings);
        this.query.setProperty("saiku.ui.headings", j);
        this.query.run(true);


        this.$el.dialog('destroy').remove();
    }
});
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
 * Base 64 module
 */

;(function (window) {
  /*jshint -W030 */
  var
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    fromCharCode = String.fromCharCode,
    INVALID_CHARACTER_ERR = (function () {
      // fabricate a suitable error object
      try { document.createElement('$'); }
      catch (error) { return error; }}());

  // encoder
  window.Base64 || (
  window.Base64 = { encode: function (string) {
    var
      a, b, b1, b2, b3, b4, c, i = 0,
      len = string.length, max = Math.max, result = '';

    while (i < len) {
      a = string.charCodeAt(i++) || 0;
      b = string.charCodeAt(i++) || 0;
      c = string.charCodeAt(i++) || 0;

      if (max(a, b, c) > 0xFF) {
        throw INVALID_CHARACTER_ERR;
      }

      b1 = (a >> 2) & 0x3F;
      b2 = ((a & 0x3) << 4) | ((b >> 4) & 0xF);
      b3 = ((b & 0xF) << 2) | ((c >> 6) & 0x3);
      b4 = c & 0x3F;

      if (!b) {
        b3 = b4 = 64;
      } else if (!c) {
        b4 = 64;
      }
      result += characters.charAt(b1) + characters.charAt(b2) + characters.charAt(b3) + characters.charAt(b4);
    }
    return result;
  }});

}(this));

/**
 * Model which handles AJAX calls to the Saiku Server
 * If you want to hook the UI up to something besides the Saiku Server,
 * this is the class which you want to override.
 * @returns {SaikuServer}
 */
Backbone.sync = function(method, model, options) {
    var params;
    methodMap = {
        'create': "POST",
        'read': "GET",
        'update': "PUT",
        'delete': "DELETE"
    };
    
    // Generate AJAX action
    var type = methodMap[method];
    var url = Settings.REST_URL + (_.isFunction(model.url) ? model.url() : model.url);
    
    // Prepare for failure
    if (typeof Settings.ERRORS == "undefined") {
        Settings.ERRORS = 0;
    }

    var errorLogout = function() {
        Settings.ERRORS++;
        if (Settings.ERRORS < Settings.ERROR_TOLERANCE) {
          Saiku.session.logout();
        } else {
          Saiku.ui.block("Communication problem with the server. Please reload the application...");
        }
    };
    var statuscode = {
      0: function() {
        errorLogout();
      },
      401: function() {
        errorLogout();
      }
    };

    var failure = function(jqXHR, textStatus, errorThrown) {
      if (!isIE && typeof console != "undefined" && console && console.error) {
        console.error("Error performing " + type + " on " + url);
        console.error(errorThrown);
      }
      if (options.error) {
        options.error(jqXHR, textStatus, errorThrown);
      }
    };

    var success = function(data, textStatus, jqXHR) {
      Settings.ERRORS = 0;
      Saiku.ui.unblock();  
      options.success(data, textStatus, jqXHR);
    };
    var async = true;
    if (options.async === false) {
      async = false;
    }
    var dataType = 'json';
    if (typeof options.dataType != "undefined") {
      dataType = options.dataType;
    }

    var contentType = 'application/x-www-form-urlencoded';
    if (typeof options.contentType != "undefined") {
      contentType = options.contentType;
    }
    var data = model.attributes;
    if (typeof options.data != "undefined") {
      data = options.data;
    }
    // Default JSON-request options.
    params = {
      url:          url,
      type:         type,
      cache:        false,
      data:         data,
      contentType:  contentType,
      dataType:     dataType,
      success:      success,
      statusCode:   statuscode, 
      error:        failure,
      async:        async//,
      //processData:  false
      /*
      beforeSend:   function(request) {
        if (!Settings.PLUGIN) {
          var auth = "Basic " + Base64.encode(
              Saiku.session.username + ":" + Saiku.session.password
          );
          request.setRequestHeader('Authorization', auth);
          }
      } */
    };

    if(options.processData === false){
        params.processData = false;
    }
    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if ((Settings.BIPLUGIN && !Settings.BIPLUGIN5) || Backbone.emulateHTTP) {
      if (type === 'PUT' || type === 'DELETE') {
        if (Backbone.emulateHTTP) params.data._method = type;
        params.type = 'POST';
        params.beforeSend = function(xhr) {
          xhr.setRequestHeader("X-HTTP-Method-Override", type);
        };
      }
    }

    // Make the request
    $.ajax(params);
};
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
 * Router for opening query when session is initialized
 */
var QueryRouter = Backbone.Router.extend({
    routes: {
        'query/open/*query_name': 'open_query',
        'query/open': 'open_query_repository'
    },

    open_query: function(query_name) {
        Settings.ACTION = "OPEN_QUERY";
        var options = {};
        var dataType = "text";
        if (!Settings.BIPLUGIN5 && Settings.BIPLUGIN) {
            var file = (Settings.GET.SOLUTION ? (Settings.GET.SOLUTION + "/") : "") +
                       (Settings.GET.PATH && Settings.GET.PATH != "/" ? (Settings.GET.PATH + "/") : "") +
                       (Settings.GET.ACTION || "");
            options = {
                file: file
            };
        } else {
            options = {
                file: query_name
            };
        }

        var params = _.extend({
                file: options.file
            }, Settings.PARAMS);

        var dialog = {
            populate: function(repository) {
                if (repository && repository.length > 0) {
                    var f = repository[0];
                    var query = new Query(params,{ name: options.file });

                    Saiku.tabs.add(new Workspace({ query: query, item: repository[0] }));

                } else {
                    Saiku.tabs.add(new Workspace());
                }
                Settings.INITIAL_QUERY = false;
            }
        };

		var repositoryFile = new Repository({}, { dialog: dialog, file: options.file }).fetch({ async: false, data: { path: options.file }});






    },

    open_query_repository: function( ) {
        Toolbar.prototype.open_query( );
    }
});

Saiku.routers.push(new QueryRouter());
/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2015
 */

/**
 * @dependencies
 * - plugins/CCC_Chart/plugin.js
 * - render/SaikuChartRenderer.js
 * - views/QueryToolbar.js
 * - views/Workspace.js
 */

/**
 * Class for edit charts
 * 
 * @class ChartEditor
 */
var ChartEditor = Modal.extend({
    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
    type: 'chart-editor',

    /**
     * Property with main template of modal
     *
     * @property message
     * @type {String}
     * @private
     */
    message: '<form class="form-group-inline">' +
                '<div class="form-group"><label for="chart-title" class="i18n">Chart Title:</label>' +
                '<input type="text" class="form-control" id="chart-title"></div>' +
                '<div class="form-group"><label for="xtitle" class="i18n">X Axis label:</label>' +
                '<input type="text" class="form-control" id="xtitle"></div>' +
                '<div class="form-group"><label for="ytitle" class="i18n">Y Axis label:</label>' +
                '<input type="text" class="form-control" id="ytitle"></div>' +
                '<div class="form-group"><label for="colors" class="i18n">Colours:</label>' +
                '<input type="color" id="color1">' +
                '<input type="color" class="startEmpty" id="color2">' +
                '<input type="color" class="startEmpty" id="color3"></div>' +
                '<div class="form-group "><label for="legend" class="i18n">Show Legend:</label>' +
                '<label for="legend" class="lbl-legend-yes i18n"><input type="radio" name="legend" value="true"' +
                ' checked> Yes</label>'+
                '<label for="legend" class="lbl-legend-no i18n"><input type="radio" name="legend" value="false">' +
                ' No</label></div>' +
                '<div class="div-trend">' +
                    '<div class="form-group"><label for="trend-line" class="i18n">Trend Line:</label>' +
                    '<select class="form-control" id="trend-line">' +
                        '<option value="none" class="i18n">None</option>' +
                        '<option value="linear" class="i18n">Linear</option>' +
                        '<option value="weighted-moving-average" class="i18n">Weighted Moving Average</option>' +
                        '<option value="moving-average" class="i18n">Moving Average</option>' +
                    '</select></div>' +
                    '<div class="form-group"><div class="div-trend-points">' +
                        '<label for="trend-points" class="i18n">Trend Periods:</label>' +
                        '<input class="form-control" type="text" id="trend-points" value="3">' +
                    '</div></div>' +
                '</div>' +
             '</form>',

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Save', method: 'save' },
        { text: 'Cancel', method: 'close' }
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click  .dialog_footer a' : 'call',
        'change #trend-line'      : 'hide_periods'
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.options.title = 'Chart Settings';
        this.renderer = {};

        if (args && args.workspace && args.data) {
            this.workspace = args.workspace;
            this.renderer = args.data;
        }

        // Maintain `this` in callbacks
        _.bindAll(this, 'template_editor', 'get_chart_properties', 'hide_periods');

        this.bind('open', function() {
            this.get_chart_properties();
        });
    },

    /**
     * Main template of modal
     *
     * @public
     * @method template_editor
     * @return {String} HTML template
     */
    template_editor: function() {
        return this.message;
    },

    /**
     * Plugin color picker Spectrum and options
     *
     * @method spectrum_options
     * @private
     * @param  {String} color Color selected
     * @return {Object}       Plugin Spectrum options
     */
    spectrum_options: function(color) {
        return {
            color: color,
            showInput: true,
            showInitial: true,
            showPalette: true,
            showSelectionPalette: true,
            maxPaletteSize: 10,
            preferredFormat: 'hex',
            palette: [
                ['rgb(0, 0, 0)', 'rgb(67, 67, 67)', 'rgb(102, 102, 102)', 'rgb(153, 153, 153)','rgb(183, 183, 183)',
                'rgb(204, 204, 204)', 'rgb(217, 217, 217)', 'rgb(239, 239, 239)', 'rgb(243, 243, 243)', 'rgb(255, 255, 255)'],
                ['rgb(152, 0, 0)', 'rgb(255, 0, 0)', 'rgb(255, 153, 0)', 'rgb(255, 255, 0)', 'rgb(0, 255, 0)',
                'rgb(0, 255, 255)', 'rgb(74, 134, 232)', 'rgb(0, 0, 255)', 'rgb(153, 0, 255)', 'rgb(255, 0, 255)'],
                ['rgb(230, 184, 175)', 'rgb(244, 204, 204)', 'rgb(252, 229, 205)', 'rgb(255, 242, 204)', 'rgb(217, 234, 211)',
                'rgb(208, 224, 227)', 'rgb(201, 218, 248)', 'rgb(207, 226, 243)', 'rgb(217, 210, 233)', 'rgb(234, 209, 220)',
                /*'rgb(221, 126, 107)',*/ 'rgb(234, 153, 153)', 'rgb(249, 203, 156)', 'rgb(255, 229, 153)', 'rgb(182, 215, 168)',
                'rgb(162, 196, 201)', 'rgb(164, 194, 244)', 'rgb(159, 197, 232)', 'rgb(180, 167, 214)', 'rgb(213, 166, 189)',
                'rgb(204, 65, 37)', /*'rgb(224, 102, 102)',*/ 'rgb(246, 178, 107)', 'rgb(255, 217, 102)', 'rgb(147, 196, 125)',
                'rgb(118, 165, 175)', 'rgb(109, 158, 235)', 'rgb(111, 168, 220)', 'rgb(142, 124, 195)', 'rgb(194, 123, 160)',
                'rgb(166, 28, 0)', 'rgb(204, 0, 0)', /*'rgb(230, 145, 56)',*/ 'rgb(241, 194, 50)', 'rgb(106, 168, 79)',
                'rgb(69, 129, 142)', 'rgb(60, 120, 216)', 'rgb(61, 133, 198)', 'rgb(103, 78, 167)', 'rgb(166, 77, 121)',
                'rgb(133, 32, 12)', 'rgb(153, 0, 0)', 'rgb(180, 95, 6)', /*'rgb(191, 144, 0)',*/ 'rgb(56, 118, 29)',
                'rgb(19, 79, 92)', 'rgb(17, 85, 204)', 'rgb(11, 83, 148)', 'rgb(53, 28, 117)', 'rgb(116, 27, 71)',
                'rgb(91, 15, 0)', 'rgb(102, 0, 0)', 'rgb(120, 63, 4)', 'rgb(127, 96, 0)', /*'rgb(39, 78, 19)',*/
                'rgb(12, 52, 61)', 'rgb(28, 69, 135)', 'rgb(7, 55, 99)', 'rgb(32, 18, 77)', 'rgb(76, 17, 48)']
            ]
        }
    },

    /**
     * Properties charts
     *
     * @method get_chart_properties
     * @public
     */
    get_chart_properties: function() {
        var args = Array.prototype.slice.call(arguments);
        var chartOptions = {};

        if (_.isEmpty(args)) {
            chartOptions = this.workspace.query.getProperty('saiku.ui.chart.options');
        }
        else {
            this.$el = args[0].element;
            this.renderer.type = args[0].type;
            if (args[0].chartDefinition && !(_.isEmpty(args[0].chartDefinition))) {
                chartOptions.chartDefinition = _.isString(args[0].chartDefinition) ? JSON.parse(args[0].chartDefinition) : args[0].chartDefinition;
            }
        }

        if (chartOptions !== undefined && chartOptions.chartDefinition !== undefined && chartOptions.chartDefinition.title !== null) {
            this.$el.find('#chart-title').val(chartOptions.chartDefinition.title);
        }

        if (chartOptions !== undefined && chartOptions.chartDefinition !== undefined && chartOptions.chartDefinition.baseAxisTitle !== null) {
            this.$el.find('#xtitle').val(chartOptions.chartDefinition.baseAxisTitle);
        }

        if (chartOptions !== undefined && chartOptions.chartDefinition !== undefined && chartOptions.chartDefinition.orthoAxisTitle !== null) {
            this.$el.find('#ytitle').val(chartOptions.chartDefinition.orthoAxisTitle);
        }

        if (chartOptions === undefined || chartOptions.chartDefinition === undefined || chartOptions.chartDefinition.colors === undefined) {
            this.$el.find('#color1').spectrum(this.spectrum_options('#bb0000'));
            this.$el.find('#color2').spectrum(this.spectrum_options('#007070'));
            this.$el.find('#color3').spectrum(this.spectrum_options('#74af00'));
        }
        else {            
            this.$el.find('#color1').spectrum(this.spectrum_options(chartOptions.chartDefinition.colors[0]));
            this.$el.find('#color2').spectrum(this.spectrum_options(chartOptions.chartDefinition.colors[1]));
            this.$el.find('#color3').spectrum(this.spectrum_options(chartOptions.chartDefinition.colors[2]));
        }

        if (chartOptions !== undefined && chartOptions.chartDefinition !== undefined && chartOptions.chartDefinition.legend !== null) {
            this.$el.find('input[type=radio][value="' + chartOptions.chartDefinition.legend + '"]').first().attr('checked', 'checked');
        }

        if (this.renderer.type === 'line') {
            this.$el.find('.div-trend').show();
            if (chartOptions !== undefined && chartOptions.chartDefinition !== undefined && chartOptions.chartDefinition.trend !== null) {
                this.$el.find('#trend-line').val(chartOptions.chartDefinition.trend.type);
                if (chartOptions.chartDefinition.trend.type !== 'linear' || chartOptions.chartDefinition.trend.type !== 'none') {
                    this.$el.find('.div-trend-points').show();
                    this.$el.find('#trend-points').val(chartOptions.chartDefinition.trend.periods);
                }
                else {
                    this.$el.find('.div-trend-points').hide();
                }
            }
            else {
                this.$el.find('.div-trend-points').hide();
            }
        }
        else {
            this.$el.find('.div-trend').hide();
        }
    },

    /**
     * Show/hide periods
     *
     * @method hide_periods
     * @public
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    hide_periods: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);
        var value = $currentTarget.val();

        if (value !== 'linear' && value !== 'none') {
            this.$el.find('.div-trend-points').show();
        }
        else {
            this.$el.find('.div-trend-points').hide();
        }
    },

    /**
     * Save chart options
     *
     * @method save
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    save: function(event) {
        event.preventDefault();

        var override = {};
        var colors = [];
        var type;

        override.chartDefinition = {};

        this.renderer.cccOptions.title = this.$el.find('#chart-title').val();
        
        if (this.$el.find('#chart-title').val() !== null) {
            override.chartDefinition.title = this.$el.find('#chart-title').val();
        }

        if (this.$el.find('#xtitle').val() !== null) {
            override.chartDefinition.baseAxisTitle = this.$el.find('#xtitle').val();
        }

        if (this.$el.find('#ytitle').val() !== null) {
            override.chartDefinition.orthoAxisTitle = this.$el.find('#ytitle').val();
        }

        if (this.$el.find('#color1').val() !== null || this.$el.find('#color1').val() !== '') {
            colors.push(this.$el.find('#color1').spectrum('get').toHexString());
        }

        if (this.$el.find('#color2').val() !== null || this.$el.find('#color2').val() !== '') {
            colors.push(this.$el.find('#color2').spectrum('get').toHexString());
        }

        if (this.$el.find('#color3').val() !== null || this.$el.find('#color3').val() !== '') {
            colors.push(this.$el.find('#color3').spectrum('get').toHexString());
        }

        override.chartDefinition.colors = colors;
        override.chartDefinition.legend = this.$el.find('input:radio[name=legend]:checked').val() === 'true';

        if (this.$el.find('#trend-line').val() !== 'none') {
            override.chartDefinition.trend = {
                type: this.$el.find('#trend-line').val(),
                periods: this.$el.find('#trend-points').val()
            };
        }
        else {
            override.chartDefinition.trend = null;
        }
        
        type = this.workspace.querytoolbar.$el.find('ul.chart li').not('.chart_editor').find('a.on').attr('href').replace('#', '');

        this.workspace.querytoolbar.$el.find('ul.chart [href="#charteditor"]').addClass('on');
        this.renderer.switch_chart(this.renderer.type, override);
        this.workspace.query.setProperty('saiku.ui.chart.options', override);
        this.workspace.query.setProperty('saiku.ui.render.type', type);
        this.$el.dialog('close');
    }
});
/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Tom Barber, 2015
 */

/**
 * @dependencies
 * - leaflet/leaflet-heat.js
 * - plugins/CCC_Chart/map_editor.css
 * - plugins/CCC_Chart/plugin.js
 * - render/SaikuMapRenderer.js
 * - views/QueryToolbar.js
 * - views/Workspace.js
 * - Saiku.js
 * - Settings.js
 */

/**
 * Class for edit map
 * 
 * @class MapEditor
 */
var MapEditor = Modal.extend({
    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
    type: 'map-editor',

    /**
     * Property with main template of modal
     *
     * @property message
     * @type {String}
     * @private
     */
    message: '<form class="form-group">' +
                '<label for="map-type" class="i18n">Map Type:</label>' +
                '<select id="map-type">' +
                    // '<option value="map_geo">Geo Map</option>' +
                    // '<option value="map_heat">Heat Map</option>' +
                    // '<option value="map_marker" selected>Marker Map</option>' +
                '</select>' +
                '<div class="div-country" hidden>' +
                    '<label for="select-country" class="i18n">Select Country Field:</label>' +
                    '<select id="select-country"></select>' +
                '</div>' +
                '<div class="div-geo">' +
                    '<label for="geo-lookup" class="i18n">Geo Lookup: <input type="checkbox" id="geo-lookup" value="true" checked></label>' +
                    '<div class="div-latlon" hidden>' +
                        '<label for="lat" class="i18n">Latitude Field:</label>' +
                        '<select id="lat"><option value=""></option></select>' +
                        '<label for="lon" class="i18n">Longitude Field:</label>' +
                        '<select id="lon"><option value=""></option></select>' +
                    '</div>' +
                    // '<div class="div-lookup">' +
                    //     '<label for="lookups">Lookup Fields:</label>' +
                    //     '<select id="lookups" multiple></select>' +
                    //     '<label for="geo-bias">Geo Bias (<a href="http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry" id="region-codes" target="_blank">Region Codes</a>):' +
                    //     '<input type="text" id="geo-bias">' +
                    // '</div>' +
                '</div>' +
                '<div class="div-metric">' +
                    '<label for="select-metric" class="i18n">Select a Metric:</label>' +
                    '<select id="select-metric"></select>' +
                '</div>' +
                '<div class="div-lookup">' +
                    '<div class="div-search chosen-mb" hidden>' +
                        '<label for="street-lookups" class="i18n">Street Mapping:</label>' +
                        '<select id="street-lookups"><option value=""></option></select>' +
                        '<label for="city-lookups" class="i18n">City Mapping:</label>' +
                        '<select id="city-lookups"><option value=""></option></select>' +
                        '<label for="county-lookups" class="i18n">County Mapping:</label>' +
                        '<select id="county-lookups"><option value=""></option></select>' +
                        '<label for="state-lookups" class="i18n">State Mapping:</label>' +
                        '<select id="state-lookups"><option value=""></option></select>' +
                        '<label for="country-lookups" class="i18n">Country Mapping:</label>' +
                        '<select id="country-lookups"><option value=""></option></select>' +
                    '</div>' +
                '</div>' +
             '</form>',

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Save', method: 'save' },
        { text: 'Cancel', method: 'close' },
        { text: 'Help', method: 'help' }
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click  .dialog_footer a' : 'call',
        'change #map-type'        : 'change_map',
        'click  #geo-lookup'      : 'change_geo',
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.options.title = 'Map Settings';

        if (args && args.data && _.has(args, 'data')) {
            var mapProperties = this.workspace.query.getProperty('saiku.ui.map.options');
            var mapType = mapProperties ? mapProperties.mapDefinition.type : '';
            this.renderer = args.data;
        }
        else {
            this.$el = args;
        }
        
        // console.log(this.workspace);
        // console.log(this.workspace.query);
        // console.log(this.workspace.query.getProperty('saiku.ui.map.options'));
        // console.log(this.workspace.query.getProperty('saiku.ui.render.mode'));
        // console.log(this.workspace.query.getProperty('saiku.ui.render.type'));
        
        // Maintain `this` in callbacks
        _.bindAll(this, 'template_editor', 'post_render', 'show_map_type', 'get_rows', 'get_map_properties');

        this.bind('open', function() {
            this.post_render();
            this.show_map_type();
            this.get_rows(this.workspace.query);
            this.get_map_properties(mapProperties, mapType);
            this.$el.find('select').chosen({ allow_single_deselect: true });
        });
    },

    /**
     * Main template of modal
     *
     * @public
     * @method template_editor
     * @return {String} HTML template
     */
    template_editor: function() {
        return this.message;
    },

    /**
     * Redirect for link in wiki
     *
     * @method help
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    help: function(event) {
        event.preventDefault();
        window.open('http://wiki.meteorite.bi/display/SAIK/Maps');
    },

    /**
     * Centralize dialog in screen
     *
     * @method post_render
     * @public
     */
    post_render: function() {
        var tPerc = (((($('body').height() - 500) / 2) * 100) / $('body').height());
        var lPerc = (((($('body').width() - 500) / 2) * 100) / $('body').width());

        this.$el.dialog('option', 'position', 'center');
        this.$el.parents('.ui-dialog').css({ 
            width: '500px', 
            top: tPerc + '%', 
            left: lPerc + '%' 
        });
    },

    /**
     * Show the map type (Geo Map, Heat Map or Marker Map)
     *
     * @method show_map_type
     * @private
     */
    show_map_type: function() {
        if (Settings.MAPS_TYPE === 'OSM') {
            this.$el.find('#map-type').append(
                '<option value="map_heat">Heat Map</option>' +
                '<option value="map_marker" selected>Marker Map</option>'
            );
            this.$el.find('.div-search').show();
        }
        // else if (Settings.MAPS_TYPE === 'GMAPS') {
        //     this.$el.find('#map-type').append(
        //         '<option value="map_geo">Geo Map</option>' +
        //         '<option value="map_heat">Heat Map</option>' +
        //         '<option value="map_marker" selected>Marker Map</option>'
        //     );
        //     this.$el.find('.div-search').hide();
        // }
    },

    /**
     * Template for create element <option>
     *
     * @method option_template
     * @private
     * @param  {Object} parameters Name parameter
     * @return {String}            HTML template
     */
    option_template: function(data) {
        return _.template(
            '<% _.each(obj.data, function(name) { %>' +
                '<option value="<%= name %>"><%= name %></option>' +
            '<% }); %>'
        )({ data: data });
    },

    /**
     * Get rows and append data in element <option>
     *
     * @method get_rows
     * @public
     * @param  {Object} query data
     */
    get_rows: function(query) {
        var rows = query.model ? query.model.queryModel.axes.ROWS.hierarchies : query.queryModel.axes.ROWS.hierarchies;
        var measures = query.model ? query.model.queryModel.details.measures : query.queryModel.details.measures;
        var arrRows = [];
        var arrMeasures = [];
        var $rowsTemplate;
        var $measuresTemplate;

        _.each(rows, function(row) {
            _.each(row.levels, function(level) {
                arrRows.push(level.name);
            });
        });

        _.each(measures, function(measure) {
            arrMeasures.push(measure.name);
        });

        $rowsTemplate = this.option_template(arrRows);
        $measuresTemplate = this.option_template(arrMeasures);

        this.$el.find('#select-country').append($rowsTemplate);
        this.$el.find('#lookups').append($rowsTemplate);
        this.$el.find('#street-lookups').append($rowsTemplate);
        this.$el.find('#city-lookups').append($rowsTemplate);
        this.$el.find('#county-lookups').append($rowsTemplate);
        this.$el.find('#state-lookups').append($rowsTemplate);
        this.$el.find('#country-lookups').append($rowsTemplate);
        this.$el.find('#lat').append($rowsTemplate);
        this.$el.find('#lon').append($rowsTemplate);
        this.$el.find('#select-metric').append($measuresTemplate);
    },

    /**
     * Switch map type
     *
     * @method switch_map_type
     * @private
     * @param  {String} data Map type
     */
    switch_map_type: function(data) {
        switch (data) {
        case 'map_geo':
            this.$el.find('.div-geo').hide();
            this.$el.find('.div-country').show();
            this.$el.find('.div-metric').show();
            this.$el.find('.div-latlon').removeClass('chosen-mb');
            break;
        case 'map_heat':
            this.$el.find('.div-geo').show();
            this.$el.find('.div-country').hide();
            this.$el.find('.div-metric').hide();
            this.$el.find('.div-latlon').addClass('chosen-mb');
            break;
        case 'map_marker':
            this.$el.find('.div-geo').show();
            this.$el.find('.div-country').hide();
            this.$el.find('.div-metric').show();
            this.$el.find('.div-latlon').removeClass('chosen-mb');
            break;
        }
    },

    /**
     * Get map properties
     *
     * @method get_map_properties
     * @public
     */
    get_map_properties: function(mapProperties, mapType) {
        this.switch_map_type(mapType);

        if (mapType === 'map_marker' || mapType === 'map_heat') {
            var search = mapProperties.mapDefinition.search;

            this.$el.find('#map-type').val(mapType);
            this.$el.find('#map-type').trigger('chosen:updated');

            if ((mapProperties.mapDefinition.latfield === null || mapProperties.mapDefinition.latfield === undefined) &&
                (mapProperties.mapDefinition.lonfield === null || mapProperties.mapDefinition.lonfield === undefined)) {
                this.$el.find('#geo-lookup').prop('checked', true);
                this.$el.find('#lookups').val(mapProperties.mapDefinition.lookupfields);
                this.$el.find('#lookups').trigger('chosen:updated');
                this.$el.find('#geo-bias').val(mapProperties.mapDefinition.bias);
                
                if (search.street !== undefined && search.street !== '') {
                    this.$el.find('#street-lookups').val(search.street);
                }
                if (search.city !== undefined && search.city !== '') {
                    this.$el.find('#city-lookups').val(search.city);
                }
                if (search.county !== undefined && search.county !== '') {
                    this.$el.find('#county-lookups').val(search.county);
                }
                if (search.state !== undefined && search.state !== '') {
                    this.$el.find('#state-lookups').val(search.state);
                }
                if (search.country !== undefined && search.country !== '') {
                    this.$el.find('#country-lookups').val(search.country);
                }
            }
            else {
                this.$el.find('#geo-lookup').prop('checked', false);
                this.$el.find('#lat').val(mapProperties.mapDefinition.latfield);
                this.$el.find('#lon').val(mapProperties.mapDefinition.lonfield);
                this.$el.find('#lat').trigger('chosen:updated');
                this.$el.find('#lon').trigger('chosen:updated');
            }
        }
        else if (mapType === 'map_geo') {
            this.$el.find('#map-type').val(mapType);
            this.$el.find('#map-type').trigger('chosen:updated');
            this.$el.find('#select-country').val(mapProperties.mapDefinition.lookupfields);
            this.$el.find('#select-country').trigger('chosen:updated');
        }

        if (mapType === 'map_marker' || mapType === 'map_geo') {
            this.$el.find('#select-metric').val(mapProperties.mapDefinition.metric);
            this.$el.find('#select-metric').trigger('chosen:updated');
        }

        if (mapProperties && mapProperties.mapDefinition && 
            mapProperties.mapDefinition.search !== null && mapProperties.mapDefinition.search !== undefined) {
            //this.$el.find('#select-search').val(mapProperties.mapDefinition.search);
            this.$el.find('#street-lookups').val(search.street);
            this.$el.find('#city-lookups').val(search.city);
            this.$el.find('#county-lookups').val(search.county);
            this.$el.find('#state-lookups').val(search.state);
            this.$el.find('#country-lookups').val(search.country);
            this.$el.find('#street-lookups').trigger('chosen:updated');
            this.$el.find('#city-lookups').trigger('chosen:updated');
            this.$el.find('#county-lookups').trigger('chosen:updated');
            this.$el.find('#state-lookups').trigger('chosen:updated');
            this.$el.find('#country-lookups').trigger('chosen:updated');
        }

        this.change_geo();
    },

    /**
     * Change Map Type
     *
     * @method change_map
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    change_map: function(event) {
        event.preventDefault();
        var $currentTarget = $(event.currentTarget);
        var value = $currentTarget.val();
        this.switch_map_type(value);
    },

    /**
     * Change Geo Lookup
     *
     * @method change_geo
     * @private
     */
    change_geo: function() {
        if (this.$el.find('#geo-lookup').is(':checked')) {
            this.$el.find('.div-lookup').show();
            this.$el.find('.div-latlon').hide();
            this.$el.find('.div-metric').removeClass('chosen-mb');
        } 
        else {
            this.$el.find('.div-lookup').hide();
            this.$el.find('.div-latlon').show();
            this.$el.find('.div-metric').addClass('chosen-mb');
        }
    },

    /**
     * Save map options
     *
     * @method save
     * @private
     * @param  {Object} event The Event interface represents any event of the DOM
     */
    save: function(event) {
        event.preventDefault();
        var mapType = this.$el.find('#map-type').val();
        var mapProperties = {};
        var saikuMapRenderer;
        var search;
        
        mapProperties.mapDefinition = {};
        mapProperties.mapDefinition.type = mapType;

        if (mapType === 'map_geo') {
            mapProperties.mapDefinition.lookupfields = this.$el.find('#select-country').val();
        }
        else {
            if (this.$el.find('#geo-lookup').is(':checked')) {
                mapProperties.mapDefinition.lookupfields = this.$el.find('#lookups').val();
                mapProperties.mapDefinition.latfield = null;
                mapProperties.mapDefinition.lonfield = null;
                mapProperties.mapDefinition.bias = this.$el.find('#geo-bias').val();
            }
            else {
                mapProperties.mapDefinition.latfield = this.$el.find('#lat').val();
                mapProperties.mapDefinition.lonfield = this.$el.find('#lon').val();
                mapProperties.mapDefinition.lookupfields = null;
            }
        }

        // mapProperties.mapDefinition.maptype = mapType;
        mapProperties.mapDefinition.geolookup = this.$el.find('#geo-lookup').is(':checked');
        mapProperties.mapDefinition.metric = this.$el.find('#select-metric').val();
        mapProperties.mapDefinition.search = {};
        mapProperties.mapDefinition.search.street = this.$el.find('#street-lookups').val();
        mapProperties.mapDefinition.search.city = this.$el.find('#city-lookups').val();
        mapProperties.mapDefinition.search.county = this.$el.find('#county-lookups').val();
        mapProperties.mapDefinition.search.state = this.$el.find('#state-lookups').val();
        mapProperties.mapDefinition.search.country = this.$el.find('#country-lookups').val();
        mapProperties.hasProcessed = false;
        search = mapProperties.mapDefinition.search;

        if ((search.street !== '' || search.city !== '' || search.county !== '' || search.state !== '' || search.country !== '') || 
            (mapProperties.mapDefinition.latfield !== null || mapProperties.mapDefinition.lonfield !== null)) {

            if (Settings.MAPS_TYPE === 'OSM') {
                saikuMapRenderer = new SaikuMapRenderer(this, mapType, mapProperties, 'run_workspace_map');
                saikuMapRenderer.renderMap();
            }
            // else if (Settings.MAPS_TYPE === 'GMAPS') {
            //     this.renderer.switch_chart(mapType, mapProperties);
            // }
            
            // TODO: Add icon loading of Saiku when OSM this processing "lat" and "lon"
            if (mapProperties.mapDefinition.latfield === null && mapProperties.mapDefinition.lonfield === null) {
                Saiku.ui.block('Loading map...');
            }

            // Set properties
            this.workspace.query.setProperty('saiku.ui.map.options', mapProperties);
            this.workspace.query.setProperty('saiku.ui.render.mode', 'map');
            this.workspace.query.setProperty('saiku.ui.render.type', mapType);
        }

        this.$el.dialog('close');
    }
});
var Tour = Backbone.View.extend({
    initialize: function(args) {
        _.bindAll(this, "run_tour");
        _.extend(this, Backbone.Events);


        this.toolbar = args.toolbar;


    },
    run_tour: function(){
var that = this;
        var st = [{
            // this is a step object
            content: '<p>Click here to open a new query.</p>',
            highlightTarget: true,
            nextButton: false,
            closeButton: true,
            target: $('#new_query'),
            my: 'top left',
            at: 'right bottom',
            setup: function(tour, options){
                //options.view.reset();
                Saiku.events.bind('toolbar:new_query', this.onSelectKitten);
                //options.view.enable();
            },
            teardown: function(tour, options){
                // Disallow more kitten selection
                //options.view.disable();
                Saiku.events.unbind('toolbar:new_query', this.onSelectKitten);
            },
            bind: ['onSelectKitten'],
            onSelectKitten: function(tour, options, view, kitten){
                options.view = kitten;
                tour.next();
            }
        },
            {
                content: '<p>Select the Foodmart Sales Cube</p>',
                highlightTarget: true,
                nextButton: false,
                closeButton: true,
                target: $('.cubes'),
                my: 'bottom center',
                at: 'top center',
                setup: function(tour, options){
                    //options.view.reset();
                    //options.view.bind('workspace:new_query', this.onSelectCube);
                    Saiku.events.bind('workspace:new_query', this.onSelectCube);
                    //options.view.enable();
                },
                teardown: function(tour, options){
                    // Disallow more kitten selection
                    //options.view.disable();
                    Saiku.events.unbind('workspace:new_query', this.onSelectCube);
                },
                bind: ['onSelectCube'],
                onSelectCube: function(tour, options, view, kitten){
                    if(kitten.cube==="Sales"){
                        options.view = kitten.view;
                        setTimeout( function(){
                            if(that.exec){
                                tour.next();
                            }
                            else{
                                that.exec = true;
                                tour.next();

                            }
                        }, 200 );
                        //tour.next();
                    }
                    else{
                        $('.tour-container').html('<p>You didn\'t select the Sales cube.</p>');
                    }

                }
            },
            {
                content: '<p>Great, next we need to execute a query.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.dimension_tree'),
                my: 'bottom center',
                at: 'top center',
                setup: function(tour, options){
                    return { target: $('.dimension_tree')}
                }
            },
            {
                content: '<p>First lets expand the Customer dimension.</p>',
                highlightTarget: true,
                nextButton: false,
                closeButton: true,
                target: $('a[title="Customer"]'),
                my: 'left center',
                at: 'right center',
                setup: function(tour, options){
                    Saiku.events.bind('workspace:expandDimension', this.onExpandDimension);
                    return { target: $('a[title="Customer"]')}
                },
                bind: ['onExpandDimension'],
                onExpandDimension: function(tour, options, view, kitten){
                    tour.next();
                }
            },
            {
                content: '<p>Great next drag the State Province level to the Rows dropzone.</p>',
                highlightTarget: true,
                nextButton: false,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'left center',
                at: 'right center',
                setup: function(tour, options){

                    Saiku.events.bind('workspaceDropZone:select_dimension', this.onSelectLevel);

                    $('a[title="State Province"]').addClass("tour-highlight");
                    return { target: $('.rows_fields')}
                },
                bind: ['onSelectLevel'],
                onSelectLevel: function(tour, options, view, kitten){
                    if(kitten.hierarchy === "[Customer].[Customers]" && kitten.level === "State Province"){
                        tour.next();
                    }
                    else{
                        $('.tour-container').html('<p>You didn\'t select the correct level. ' +
                            'Remove this one and replace it with the highlighted level.</p>');
                    }

                }
            },
            {
                content: '<p>Next we\'ll add a measure. Drag Unit Sales into the Measures Drop Zone.</p>',
                highlightTarget: true,
                nextButton: false,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'left top',
                at: 'right bottom',
                setup: function(tour, options){

                    Saiku.events.bind('workspaceDropZone:select_measure', this.onSelectMeasure);

                    return { target: $('a[title="[Measures].[Unit Sales]"]')}
                },
                bind: ['onSelectMeasure'],
                onSelectMeasure: function(tour, options, view, kitten){
                    if(kitten.measure.name === "Unit Sales"){
                        tour.next();
                    }
                    else{
                        $('.tour-container').html('<p>You didn\'t select the correct measure. ' +
                            'Remove this one and replace it with the highlighted measure.</p>');
                    }

                }
            },
            {
                content: '<p>Great, we\'ve now run a very basic query. Now we\'ll view it as a chart.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'bottom center',
                at: 'top center',
                setup: function(tour, options){
                    return { target: $('div.table_wrapper')}
                }
            },
            {
                content: '<p>To view your data as a chart, click on the chart icon.</p>',
                highlightTarget: true,
                nextButton: false,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'right center',
                at: 'left center',
                setup: function(tour, options){

                    Saiku.events.bind('queryToolbar:render_chart', this.onClickChartIcon);

                    return { target: $('.query_toolbar_vertical')}
                },
                bind: ['onClickChartIcon'],
                onClickChartIcon: function(tour, options, view, kitten){
                    tour.next();
                }
            },
            {
                content: '<p>You can now select from the different chart type Saiku offers.</' +
                'p>Saiku Enterprise users can set chart properties by clicking on the properties button.</p>' +
                '<p>You can also export your chart to a file by clicking on the Export button.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'right center',
                at: 'left center',
                setup: function(tour, options){

                    Saiku.events.bind('queryToolbar:render_chart', this.onClickChartIcon);

                    return { target: $('.query_toolbar_vertical')}
                },
                bind: ['onClickChartIcon'],
                onClickChartIcon: function(tour, options, view, kitten){
                    tour.next();
                }
            },
            {
                content: '<p>On the workspace toolbar there are a number of useful buttons.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('.workspace_toolbar')}
                }
            },
            {
                content: '<p>Edit Query. This button will hide the query design area on the left of the workspace.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Edit query"]')}
                }
            },
            {
                content: '<p>Run Query/Automatic Execution. These icons allow you to manually run a query, or,' +
                ' toggle automatic query execution so that you have to exeucte the query manually.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Run query"]')}
                }
            },
            {
                content: '<p>Hide Parents. This button allows you to show the parent levels in the result set.</p>' +
                '<p>Hidden by default, some queries are easier understood when you can see the data hierarchy.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Hide Parents"]')}
                }
            },
            {
                content: '<p>Non Empty. This button hides null fields so minimise the resultset. Click this button' +
                ' to show the empty fields.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Non-empty"]')}
                }
            },
            {
                content: '<p>Zoom. Zoom into a large table, by dragging over the area you want to show.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Zoom into table"]')}
                }
            },
            {
                content: '<p>Drill Across. A way to discover more about your data. Select drill across and enable' +
                ' the required dimensions in the popup, the new result set will show you a more granular output of your previous query.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Drill across on cell"]')}
                }
            },
            {
                content: '<p>Drill Through. Drill through to the lowest level to show how your query was constructed.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Drill through on cell"]')}
                }
            },
            {
                content: '<p>We\'ve now run through the basics that Saiku Analytics has to offer. There is far more' +
                ' that we haven\'t explored so you might want to try one of the more advanced tutorials or just get started and explore yourself.</p>' +
                '<p>For more help, visit <a href="http://wiki.meteorite.bi" target="_blank">http://wiki.meteorite.bi</a>.</p>',
                highlightTarget: true,
                nextButton: true,
                closeButton: true,
                target: $('.rows_fields'),
                my: 'top center',
                at: 'bottom center',
                setup: function(tour, options){
                    return { target: $('a[original-title="Drill through on cell"]')}
                }
            },
        ];
        var tour = new Tourist.Tour({
            steps: st,
            stepOptions: {
                view: this.toolbar
            },
            tipClass: 'QTip',
            tipOptions:{ showEffect: 'slidein' }
        });
        tour.start();

    }
});

