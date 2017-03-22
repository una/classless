import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend({
  extractMeta: function(store, type, payload) {
    if (payload) {
      let meta = {
        total: payload.total,
        perPage: payload.per_page,
        pages: payload.pages
      };

      delete payload.total;
      delete payload.per_page;
      delete payload.pages;

      return meta;
    }
  }
});
