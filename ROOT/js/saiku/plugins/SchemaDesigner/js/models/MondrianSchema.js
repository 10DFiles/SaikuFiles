/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

var MondrianSchemaModel = Backbone.Model.extend({
    url: 'api/mondrian',

    defaults: {
        name: '',
        physicalschema: '',
        dimension: ''
        // roles: null
    },

    initialize: function() {
        this.cubes = new MondrianCubesCollection();
        this.cubes.parent = this;
        this.dimension = new MondrianDimensionsCollection();
        this.dimension.parent = this;
    },

   toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.cubes = this.cubes;
        attr.dimension = this.dimension;
        return attr;
    }
});

var MondrianPhysicalSchemaModel = Backbone.Model.extend({
    initialize: function() {
        this.tables = new MondrianTablesCollection();
        this.tables.parent = this;
        this.links = new MondrianLinksCollection();
        this.links.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.tables = this.tables;
        attr.links = this.links;
        return attr;
    }
});

var MondrianTablesCollection = Backbone.Collection.extend({
    model: MondrianTableModel
});

var MondrianTableModel = Backbone.Model.extend({
    defaults: {
        name: '',
        schema: ''
    },

    initialize: function() {
        this.key = new MondrianTablesKeysCollection();
        this.key.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.key = this.key;
        return attr;
    }
});

var MondrianTablesKeysCollection = Backbone.Collection.extend({
    model: MondrianTableKeyModel
});

var MondrianTableKeyModel = Backbone.Model.extend({
    initialize: function() {
        this.column = new MondrianTablesColumnCollection();
        this.column.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.column = this.column;
        return attr;
    }
});

var MondrianTablesColumnCollection = Backbone.Collection.extend({
    model: MondrianTableColumnModel
});

var MondrianTableColumnModel = Backbone.Model.extend({
    defaults: {
        name: ''
    }
});

var MondrianLinksCollection = Backbone.Collection.extend({
    model: MondrianLinkModel
});

var MondrianLinkModel = Backbone.Model.extend({
    defaults: {
        source: '',
        target: ''
        // foreignkey: ''
    },

    initialize: function() {
        this.foreignkey = new MondrianLinksForeignKeyCollection();
        this.foreignkey.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.foreignkey = this.foreignkey;
        return attr;
    }
});

var MondrianLinksForeignKeyCollection = Backbone.Collection.extend({
    model: MondrianLinkForeignKeyModel
});

var MondrianLinkForeignKeyModel = Backbone.Model.extend({
    initialize: function() {
        this.column = new MondrianLinkColumnNameForeignKeyModel();
        this.column.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.column = this.column;
        return attr;
    }
});

var MondrianLinkColumnNameForeignKeyModel = Backbone.Model.extend({
    defaults: {
        name: ''
    }
});

var MondrianCubesCollection = Backbone.Collection.extend({
    model: MondrianCubeModel
});

var MondrianCubeModel = Backbone.Model.extend({
    defaults: {
        name: '',
        defaultMeasure: '',
        annotations: '',
        calculatedMembers: ''
    },

    initialize: function() {
        this.measuregroups = new MondrianMeasureGroupsCollection();
        this.measuregroups.parent = this;
        this.dimension = new MondrianSharedDimensionsCollection();
        this.dimension.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.measuregroups = this.measuregroups;
        attr.dimension = this.dimension;
        return attr;
    }
});

var MondrianSharedDimensionsCollection = Backbone.Collection.extend({
    model: MondrianSharedDimensionsModel
});

var MondrianSharedDimensionsModel = Backbone.Model.extend({
    initialize: function() {
        this.dimension = new MondrianSharedDimensionCollection();
        this.dimension.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.dimension = this.dimension;
        return attr;
    }
});

var MondrianSharedDimensionCollection = Backbone.Collection.extend({
    model: MondrianSharedDimensionModel
});

var MondrianSharedDimensionModel = Backbone.Model.extend({
    defaults: {
        source: '',
        foreignkeycolumn: ''
    }
});

var MondrianDimensionsCollection = Backbone.Collection.extend({
    model: MondrianDimensionsModel
});

var MondrianDimensionsModel = Backbone.Model.extend({
    initialize: function() {
        this.dimension = new MondrianDimensionCollection();
        this.dimension.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.dimension = this.dimension;
        return attr;
    }
});

var MondrianDimensionCollection = Backbone.Collection.extend({
    model: MondrianDimensionModel
});

var MondrianDimensionModel = Backbone.Model.extend({
    defaults: {
        name: '',
        table: '',
        key: ''
    },

    initialize: function() {
        this.atb = new MondrianAttributesCollection();
        this.atb.parent = this;
        this.hierarchies = new MondrianHierarchiesCollection();
        this.hierarchies.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.attributes = this.atb;
        attr.hierarchies = this.hierarchies;
        return attr;
    }
});

var MondrianAttributesCollection = Backbone.Collection.extend({
    model: MondrianAttributesModel
});

var MondrianAttributesModel = Backbone.Model.extend({
    initialize: function() {
        this.attribute = new MondrianAttributeCollection();
        this.attribute.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.attribute = this.attribute;
        return attr;
    }
});

var MondrianAttributeCollection = Backbone.Collection.extend({
    model: MondrianAttributeModel
});

var MondrianAttributeModel = Backbone.Model.extend({
    defaults: {
        name: '',
        // table: '',
        // keycolumn: '',
        hashierarchy: false
    },

    initialize: function() {
        this.key = new MondrianAttributeKeyCollection();
        this.key.parent = this;
        this.namecolumn = new MondrianAttributeNameCollection();
        this.namecolumn.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.key = this.key;
        attr.namecolumn = this.namecolumn;
        return attr;
    }
});

var MondrianAttributeKeyCollection = Backbone.Collection.extend({
    model: MondrianAttributeKeyModel
});

var MondrianAttributeKeyModel = Backbone.Model.extend({
    initialize: function() {
        this.column = new MondrianAttributeColumnCollection();
        this.column.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.column = this.column;
        return attr;
    }
});

var MondrianAttributeNameCollection = Backbone.Collection.extend({
    model: MondrianAttributeNameModel
});

var MondrianAttributeNameModel = Backbone.Model.extend({
    initialize: function() {
        this.column = new MondrianAttributeColumnCollection();
        this.column.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.column = this.column;
        return attr;
    }
});

var MondrianAttributeColumnCollection = Backbone.Collection.extend({
    model: MondrianAttributeColumnModel
});

var MondrianAttributeColumnModel = Backbone.Model.extend({
    defaults: {
        name: ''
    }
});

var MondrianHierarchiesCollection = Backbone.Collection.extend({
    model: MondrianHierarchiesModel
});

var MondrianHierarchiesModel = Backbone.Model.extend({
    initialize: function() {
        this.hierarchy = new MondrianHierarchyCollection();
        this.hierarchy.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.hierarchy = this.hierarchy;
        return attr;
    }
});

var MondrianHierarchyCollection = Backbone.Collection.extend({
    model: MondrianHierarchyModel
});

var MondrianHierarchyModel = Backbone.Model.extend({
    defaults: {
        name: '',
        allmembername: ''
    },

    initialize: function() {
        this.levels = new MondrianLevelsCollection();
        this.levels.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.levels = this.levels;
        return attr;
    }
});

var MondrianLevelsCollection = Backbone.Collection.extend({
    model: MondrianLevelModel
});

var MondrianLevelModel = Backbone.Model.extend({
    defaults: {
        attribute: ''
    },

    initialize: function() {
        this.annotations = new MondrianAnnotationsCollection();
        this.annotations.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.annotations = this.annotations;
        return attr;
    }
});

var MondrianAnnotationsCollection = Backbone.Collection.extend({
    model: MondrianAnnotationsModel
});

var MondrianAnnotationsModel = Backbone.Model.extend({
    initialize: function() {
        this.annotation = new MondrianAnnotationCollection();
        this.annotation.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.annotation = this.annotation;
        return attr;
    }
});

var MondrianAnnotationCollection = Backbone.Collection.extend({
    model: MondrianAnnotationModel
});

var MondrianAnnotationModel = Backbone.Model.extend({
    defaults: {
        name: '',
        raw: ''
    }
});

var MondrianMeasureGroupsCollection = Backbone.Collection.extend({
    model: MondrianMeasureGroupModel
});

var MondrianMeasureGroupModel = Backbone.Model.extend({
    defaults: {
        name: '',
        table: ''
    },

    initialize: function() {
        this.measures = new MondrianMeasuresCollection();
        this.measures.parent = this;
        this.dimensionlinks = new MondrianDimensionLinkModel();
        this.dimensionlinks.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.measures = this.measures;
        attr.dimensionlinks = this.dimensionlinks;
        return attr;
    }
});

var MondrianMeasuresCollection = Backbone.Collection.extend({
   model: MondrianMeasureModel
});

var MondrianMeasureModel = Backbone.Model.extend({
    initialize: function() {
        this.measure = new MondrianMeasuresMeasureCollection();
        this.measure.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.measure = this.measure;
        return attr;
    }
});

var MondrianMeasuresMeasureCollection = Backbone.Collection.extend({
   model: MondrianMeasuresMeasureModel
});

var MondrianMeasuresMeasureModel = Backbone.Model.extend({
    defaults: {
        name: '',
        column: '',
        aggregator: '',
        formatstring: ''
    }
});

var MondrianNamedSetModel = Backbone.Model.extend({
    defaults: {
        name: '',
        formula: ''
    }
});

var MondrianDimensionLinksCollection = Backbone.Collection.extend({
    model: MondrianDimensionLinkModel
});

var MondrianDimensionLinkModel = Backbone.Model.extend({
    initialize: function() {
        this.foreignkeylink = new MondrianDimensionLinksForeignKeyLinkCollection();
        this.foreignkeylink.parent = this;
        this.factlink = new MondrianDimensionLinksFactLinkCollection();
        this.factlink.parent = this;
    },

    toJSON: function() {
        var attr = _.clone(this.attributes);
        attr.foreignkeylink = this.foreignkeylink;
        attr.factlink = this.factlink;
        return attr;
    }
});

var MondrianDimensionLinksForeignKeyLinkCollection = Backbone.Collection.extend({
    model: MondrianDimensionLinkForeignKeyLinkModel
});

var MondrianDimensionLinkForeignKeyLinkModel = Backbone.Model.extend({
    defaults: {
        dimension: '',
        foreignkeycolumn: ''
    }
});

var MondrianDimensionLinksFactLinkCollection = Backbone.Collection.extend({
    model: MondrianDimensionLinkFactLinkModel
});

var MondrianDimensionLinkFactLinkModel = Backbone.Model.extend({
    defaults: {
        dimension: '',
        foreignkeycolumn: ''
    }
});

// Static Models and Collections

var StaticMeasureModel = Backbone.Model.extend({});

var StaticMeasuresCollection = Backbone.Collection.extend({
    model: StaticMeasureModel
});

var StaticDimLinkModel = Backbone.Model.extend({});

var StaticDimLinksCollection = Backbone.Collection.extend({
    model: StaticDimLinkModel
});

var StaticAnnotationTimeModel = Backbone.Model.extend({});

var StaticAnnotationsTimeCollection = Backbone.Collection.extend({
    model: StaticAnnotationTimeModel
});