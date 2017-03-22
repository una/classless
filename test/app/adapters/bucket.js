import Ember from 'ember';
import App from '../app';
import ENV from '../config/environment';
import AppRestAdapter from '../adapters/application';

export default AppRestAdapter.extend({
  namespace: '',
  host: ENV['bucket-api-host'],

  sendCSRF: false,
  sendCredentials: false,
  sendRequestTracing: false,
  sendContext: false,

  updateRecord: function (store, type, snapshot) {
    if (snapshot.adapterOptions && snapshot.adapterOptions.operation === 'keys') {
      let url = this.buildURL(type.modelName, snapshot.id, snapshot, 'updateRecord');
      return this.ajax(url.replace(/buckets\/.*/, 'keys'), 'POST');
    }

    return this._super(...arguments);
  },

  headers: function(...args) {
    let headers = this._super(...args);
    headers['X-User-ID'] = App.User.get('internalIdentifier');
    return headers;
  }.property('method'),

  parseErrorResponse: function (responseText) {
    let json = responseText;
    try {
      json = Ember.$.parseJSON(responseText);
      if(json.error) {
        json = { errors: { msg: json.error } };
      }
    } catch (e) {
      // ignored
    }

    return json;
  }
});
