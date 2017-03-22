import { ActiveModelSerializer } from 'active-model-adapter';
import DS from 'ember-data';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  normalizeUpdateRecordResponse (store, primaryModelClass, payload, id, requestType) {
    if(payload.volume) {
      payload.volume.highlight_new = true;
      this.store.pushPayload('volume', payload.volume);
    }
    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
