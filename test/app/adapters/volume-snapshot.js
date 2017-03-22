import AppRestAdapter from '../adapters/application';

export default AppRestAdapter.extend({
  ajaxOptions: function(url, type, options) {
    url = url.replace('volume_snapshots', 'volumes/snapshots');
    return this._super(url, type, options);
  }
});
