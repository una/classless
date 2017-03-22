import AppRestAdapter from '../adapters/application';
import ENV from '../config/environment';

export default AppRestAdapter.extend({
  ajaxOptions: function(url, type, options) {
    let host = ENV['api-host'];
    let namespace = ENV['api-namespace'];
    let path = '/events/unresolved.js';

    url = `https://status.digitalocean.com/${namespace}${path}`;

    if(ENV.environment === 'development') {
      url = `${host}/status/${namespace}${path}`;
    }

    let hash = this._super(url, type, options);
    hash.dataType = 'jsonp';
    return hash;
  }
});