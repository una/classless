import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    updates: { embedded: 'always' }
  },
  normalizeArrayResponse: function(store, primaryModelClass, payload, id, requestType) {
    let updates = [];
    payload.events.forEach(function(event) {
      updates = [];
      event.updates.forEach(function(update) {
        updates.push(update.update);
      });
      event.updates = updates;
    });

    payload['status_notifications'] = payload.events;
    delete payload.events;

    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, false);
  }
});
