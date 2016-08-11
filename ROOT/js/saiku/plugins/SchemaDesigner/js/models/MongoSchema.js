/* Copyright (C) OSBI Ltd - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Breno Polanski, 2015
 */

var MongoSchemaModel = Backbone.Model.extend({
});

var MongoSchemasCollection = Backbone.Collection.extend({
    url: 'api/mongo/schema',
    model: MongoSchemaModel
});