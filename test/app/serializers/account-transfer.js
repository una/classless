import DS from 'ember-data';
import BaseSerializer from '../serializers/base';

export default BaseSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    image: { embedded: 'always' }
  },
  payloadKeyFromModelName: function() {
    return 'image_account_transfer';
  },
  normalizeSingleResponse: function() {
    return this._normalizeSingleResponseCustomJSONKey('image_account_transfer', ...arguments);
  },
  normalizeArrayResponse: function() {
    return this._normalizeArrayResponseCustomJSONKey('image_account_transfers', ...arguments);
  }
});