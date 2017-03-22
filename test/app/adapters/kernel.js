import SearchableRestAdapter from '../adapters/searchable';
import ENV from '../config/environment';

export default SearchableRestAdapter.extend({
  dropletId: null,
  ajax: function(url, method, hash) {
    if(method === 'GET') {
      let dropletId = this.get('dropletId');
      if(dropletId) {
        url = [ENV['api-host'],
               ENV['api-namespace'],
               'droplets',
               dropletId,
               'kernels'
              ].join('/');
        this.set('dropletId', null);
      }
    }

    return this._super(url, method, hash);
  },

  query: function(store, type, query) {
    let url = [ENV['api-host'],
               ENV['api-namespace'],
               'droplets'
              ].join('/');
    query = query || {};

    if(query.dropletId) {
      url =+ '/' + query.dropletId;
      this.set('dropletId', query.dropletId);
    }
    url += '/kernels';

    // remove dropletId from query string
    delete query.dropletId;

    return this._ajaxWithCSRF(url, query);
  }
});