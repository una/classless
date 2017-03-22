import SearchableRestAdapter from '../adapters/searchable';
import ENV from '../config/environment';
import App from '../app';

export default SearchableRestAdapter.extend({
  namespace: '',
  host: ENV['bucket-api-host'],

  sendCSRF: false,
  sendCredentials: false,
  sendRequestTracing: false,
  sendContext: false,

  headers: function(...args) {
    let headers = this._super(...args);
    headers['X-User-ID'] = App.User.get('internalIdentifier');
    return headers;
  }.property('method'),

  buildURL (modelName, id, snapshot, requestType, params) {
    let baseUrl = `${ENV['bucket-api-host']}/buckets/${params.titleToken}/objects`;
    if( requestType === 'deleteRecord' || requestType === 'updateRecord') {
      return `${baseUrl}/${id}`;
    }
    delete params.titleToken;

    return baseUrl;
  }

});
