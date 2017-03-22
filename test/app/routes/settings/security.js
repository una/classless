import Ember from 'ember';
import App from '../../app';

let errorCb = function() {
  this.error = true;
  return Ember.A();
};

export default Ember.Route.extend({
  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    },
    keys_page: {
      refreshModel: true
    },
    certificates_page: {
      refreshModel: true
    }
  },

  model: function (params) {
    let existingModel = this.modelFor('settings.security');
    let hash = {
      team: App.User.get('currentContext'),
      user: this.modelFor('application')
    };
    let keysParams = {
      page: params.keys_page
    };
    let certificatesParams = {
      page: params.certificates_page
    };
    if (existingModel) {
      // If we have not updated the events page
      let previousEventsQuery = existingModel.events.query;
      let previousCertificatesQuery = existingModel.certificates.query;
      let isExistingEventsPage = params.page === previousEventsQuery.page;
      let noFieldsHaveChanged = params.sort === previousEventsQuery.sort && params.sort_direction === previousEventsQuery.sort_direction;
      // If we have not updated the events page, use existing model
      if (isExistingEventsPage && noFieldsHaveChanged) {
        hash.events = existingModel.events;
      }
      // If we have not updated the keys page, use existing model
      if (params.keys_page === existingModel.sshKeys.query.page) {
        hash.sshKeys = existingModel.sshKeys;
      }
      // If we have not updated the certificates page, use existing model
      if (previousCertificatesQuery && params.certificates_page === previousCertificatesQuery.page) {
        hash.certificates = existingModel.certificates;
      }
    }
    if (!hash.events) {
      delete params.keys_page;
      hash.events = this.store.query('auditAction', params).then(null, errorCb.bind(this));
    }
    if (!hash.sshKeys) {
      hash.sshKeys = this.store.query('sshKey', keysParams).then(null, errorCb.bind(this));
    }
    if (!hash.certificates) {
      hash.certificates = this.store.query('certificate', certificatesParams).then(null, errorCb.bind(this));
    }
    return Ember.RSVP.hash(hash);
  }
});
