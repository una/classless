import Ember from 'ember';
import AppRestAdapter from '../adapters/application';
import ENV from '../config/environment';
import { put, del } from '../utils/apiHelpers';

export default AppRestAdapter.extend({

  baseUrl: function(teamId, memberId) {
    let url = `/api/v1/teams/${teamId}/members`;
    if (memberId) {
      url += `/${memberId}`;
    }
    return url;
  },

  query: function(store, type, query) {
    let teamId = query.teamId;
    delete query.teamId;
    let params = Ember.$.param(query);
    let path = ENV['api-host'] + this.baseUrl(teamId) + `?${params}`;
    return this._ajaxWithCSRF(path);
  },

  updateRecord: function(store, type, snapshot) {
    let teamId = snapshot.record.get('organizationId');
    let memberId = snapshot.record.get('id');
    return put(this.baseUrl(teamId, memberId), snapshot.attributes());
  },

  deleteRecord: function(store, type, snapshot) {
    let teamId = snapshot.record.get('organization.id');
    let memberId = snapshot.record.get('id');
    return del(this.baseUrl(teamId, memberId));
  },

  findRecord: function(store, type, teamId, memberId) {
    let path = ENV['api-host'] + this.baseUrl(teamId, memberId);
    return this._ajaxWithCSRF(path);
  }
});
