import Ember from 'ember';
import AppRestAdapter from '../adapters/application';
import ENV from '../config/environment';

export default AppRestAdapter.extend({
  query: function(store, type, query) {
    let params = Ember.$.param(query);
    let path = `${ENV['api-host']}/api/v1/billing/paypal_ipns?${params}`;
    return this._ajaxWithCSRF(path);
  }
});
