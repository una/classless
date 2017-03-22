import AppRestAdapter from '../adapters/application';

export default AppRestAdapter.extend({
  ajax: function(url, method, hash) {
    hash = hash || {};
    let isSearching = method === 'GET' && hash.data && hash.data.query;
    if(isSearching) {
      url += '/search';
    }
    hash.crossDomain = true;
    hash.xhrFields = { withCredentials: true };
    return this._super(url, method, hash);
  }
});
