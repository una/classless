import BaseSerializer from '../serializers/base';

export default BaseSerializer.extend({
  normalizeSingleResponse: function() {
    return this._normalizeSingleResponseCustomJSONKey('event', ...arguments);
  },
  normalizeArrayResponse: function() {
    return this._normalizeArrayResponseCustomJSONKey('events', ...arguments);
  }
});