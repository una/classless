import LifeboatAdapter from '../adapters/lifeboat';

export default LifeboatAdapter.extend({
  buildURLForSearch: function() {
    let url = [];
    let host = this.get('host');
    let prefix = this.urlPrefix();

    url.push('search');

    if (prefix) { url.unshift(prefix); }

    url = url.join('/');
    if (!host && url) { url = '/' + url; }

    return url;
  },

  query: function(store, type, query) {
    if (this.sortQueryParams) {
      query = this.sortQueryParams(query);
    }

    let url = this.buildURLForSearch(type.modelName);

    return this.ajax(url, 'GET', { data: query });
  }
});
