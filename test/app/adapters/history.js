import SearchableRestAdapter from '../adapters/searchable';
import ENV from '../config/environment';

export default SearchableRestAdapter.extend({
  query: function(store, type, query) {
    let url = [ENV['api-host'],
               ENV['api-namespace'],
               'droplets',
               query.dropletId,
               'history'
              ].join('/');

    // remove dropletId from query string
    delete query.dropletId;

    return this._ajaxWithCSRF(url, query);
  },

  findRecord: function(store, type, id) {
    let url = [ENV['api-host'],
               ENV['api-namespace'],
               'events',
               id
              ].join('/');

    return this._ajaxWithCSRF(url);
  }
});