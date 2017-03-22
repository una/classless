import BaseSerializer from '../serializers/base';

export default BaseSerializer.extend({
  normalizeArrayResponse: function() {
    return this._normalizeArrayResponseCustomJSONKey('billing_history', ...arguments);
  }
});
