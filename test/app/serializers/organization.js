import Ember from 'ember';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend({
  primaryKey: 'uuid',

  keyForAttribute: function(attr) {
    if (attr === 'internalIdentifier') {
      return 'id';
    } else {
      return Ember.String.underscore(attr);
    }
  },

  normalize: function(store, payload) {
    //properites cannot end in Id, thus Identifier
    payload.internal_identifier = payload.id;
    return this._super(...arguments);
  },

  modelNameFromPayloadKey: function() {
    return this._super('organization');
  }
});
