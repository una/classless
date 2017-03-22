import Ember from 'ember';
import ENV from '../config/environment';
import retrieveCsrfToken from '../utils/retrieveCsrfToken';
import ActiveModelAdapter from 'active-model-adapter';
import _ from 'lodash/lodash';
import {REQUEST_HEADER_NAME, CONTEXT_ID_HEADER_NAME} from '../constants';
import App from '../app';

const ERR_STATUS_MIN = 400;

let token = retrieveCsrfToken();

export default ActiveModelAdapter.extend({
  host: ENV['api-host'],
  namespace: ENV['api-namespace'],

  sendCredentials: true,
  sendRequestTracing: true,
  sendCSRF: true,
  sendContext: true,

  isInvalid: function(status){
    return status >= ERR_STATUS_MIN;
  },

  headers: function() {
    let headers = {
      'Accept': 'application/json'
    };

    // unique header with current context for deeplinking via query parameter
    if (this.sendContext && App.User && App.User.get('currentContextId')) {
      headers[CONTEXT_ID_HEADER_NAME] = App.User.get('currentContextId');
    }

    // unique request id for request tracing
    if(this.sendRequestTracing) {
      headers[REQUEST_HEADER_NAME] = App.getUUID();
    }

    if(this.sendCSRF && token && this.get('method') !== 'GET' && this.get('method') !== 'OPTIONS') {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  }.property('method').volatile(),

  ajax: function(url, method, hash) {
    this.setProperties({
      url: url,
      method: method
    });
    hash = hash || {};
    let wantsAuthorized = method === 'GET' && hash.data && hash.data.authorized;
    if(wantsAuthorized) {
      delete hash.data.authorized;
      url += '/authorized';
    }
    hash.crossDomain = true;
    hash.xhrFields = { withCredentials: !!this.sendCredentials };
    return this._super(url, method, hash);
  },

  // Converts Cloud error responses into JSON-API structured errors
  parseErrorResponse: function(responseText) {
    try {
      let parsed = JSON.parse(responseText);
      return { errors: parsed.messages };
    } catch (e) {
      return {};
    }
  },

  updateRecord: function (store, type, snapshot) {
    if (snapshot.adapterOptions && ! _.isUndefined(snapshot.adapterOptions.operation)) {
      let url = this.buildURL(type.modelName, snapshot.id, snapshot, 'updateRecord');
      let method = snapshot.adapterOptions.method || 'POST';
      url += '/' + snapshot.adapterOptions.operation;
      if (! _.isUndefined(snapshot.adapterOptions.data)) {
        return this.ajax(url, method, {data: snapshot.adapterOptions.data});
      }

      return this.ajax(url, method, {});
    }

    return this._super(...arguments);
  },

  _ajaxWithCSRF: function(url, query) {
    let settings = {
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-CSRF-Token', token);

        // unique header with current context for deeplinking via query parameter
        if (this.sendContext && App.User && App.User.get('currentContextId')) {
          xhr.setRequestHeader(CONTEXT_ID_HEADER_NAME, App.User.get('currentContextId'));
        }
        // unique request id for request tracing
        xhr.setRequestHeader(REQUEST_HEADER_NAME, App.getUUID());
      }
    };

    if(query) {
      settings.data = query;
    }

    return new Ember.RSVP.Promise((resolve, reject) => {
      this.ajax(url, 'GET', settings).then(function(data) {
        Ember.run(null, resolve, data);
      }, function(jqXHR) {
        jqXHR.then = null; // tame jQuery's ill mannered promises
        Ember.run(null, reject, jqXHR);
      });
    });
  }
});
