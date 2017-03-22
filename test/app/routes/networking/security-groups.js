import Ember from 'ember';
import { get } from '../../utils/apiHelpers';
import ENV from '../../config/environment';

export default Ember.Route.extend({
  titleToken: 'Firewalls',

  model: function() {
    return Ember.RSVP.hash({
      serviceStatus: this.getServiceStatus(),
      securityGroups: this.store.findAll('securityGroup')
    });
  },

  getServiceStatus: function() {
    return new Ember.RSVP.Promise((resolve) => {
      get(`/${ENV['api-namespace']}/security_groups/health`)
        .then((resp) => {
          resp.text().then((body) => {
            resolve({
              statusCode: resp.status,
              statusText: resp.statusText,
              url: resp.url,
              responseBody: body
            });
          });
        })
        .catch((err) => {
          resolve({
            statusCode: err.status,
            statusText: err.statusText,
            url: err.url
          });
        });
    });
  }
});
