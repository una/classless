import DS from 'ember-data';
import ENV from '../config/environment';
import {get} from '../utils/apiHelpers';

export default DS.Model.extend({
  name: DS.attr(),
  slug: DS.attr(),
  features: DS.attr(),
  dropletCount: DS.attr('number'),

  getStatistics: function(period) {
    let uri = `/${ENV['api-namespace']}/regions/${this.get('slug')}/statistics`;
    if (period){
      uri += `?period=${period}`;
    }
    return get(uri).then((resp) => {
      return resp.json();
    }).then((json) => {
      return json.statistic;
    }).catch(() => {
      return null;
    });
  },
  storageEnabled: function () {
    return this.get('features').indexOf('storage') > -1;
  }.property('features')
});
