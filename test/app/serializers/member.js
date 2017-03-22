import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend({
  normalize: function(store, payload) {

    // Placeholder ID for pending members
    payload.id = payload.id || payload.email;

    // Alias ID
    payload.internal_identifier = payload.id;

    // Nest organization ID so Ember's happy
    payload.organization = { id: payload.organization_id };

    return this._super(...arguments);
  }
});
