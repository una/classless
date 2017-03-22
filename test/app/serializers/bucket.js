import { ActiveModelSerializer } from 'active-model-adapter';
import { camelizeObject } from '../utils/normalizeObjects';

export default ActiveModelSerializer.extend({
  primaryKey: 'name',
  normalizeSingleResponse (store, primaryModelClass, payload) {
    if(payload.bucket && payload.key) {
      payload.bucket.key = camelizeObject(payload.key);
    }

    return this._super(...arguments);
  }
});

