import SearchableAdapter from '../adapters/searchable';
import ENV from '../config/environment';

export default SearchableAdapter.extend({
  findRecord: function(store, type, id) {
    let url = [ENV['api-host'],
               ENV['api-namespace'],
               'volumes',
               id
              ].join('/');
    return this._ajaxWithCSRF(url + '?include_droplet=true');
  }
});
