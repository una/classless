import Ember from 'ember';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend({
  _normalizeSingleResponseCustomJSONKey: function(key, store, primaryModelClass, payload, id, requestType) {
    let typeKey = primaryModelClass.modelName;
    payload[typeKey] = payload[key];
    delete payload[key];

    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, true);
  },
  _normalizeArrayResponseCustomJSONKey: function(key, store, primaryModelClass, payload, id, requestType) {
    let pluralTypeKey = Ember.Inflector.inflector.pluralize(primaryModelClass.modelName);
    payload[pluralTypeKey] = payload[key];
    delete payload[key];

    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, false);
  }
});
