import BaseSerializer from '../serializers/base';

export default BaseSerializer.extend({
  normalizeSingleResponse: function() {
    return this._normalizeSingleResponseCustomJSONKey('image_kernel', ...arguments);
  },
  normalizeArrayResponse: function() {
    return this._normalizeArrayResponseCustomJSONKey('image_kernels', ...arguments);
  }
});