import DS from 'ember-data';
import _ from 'lodash/lodash';
import config from '../config/environment';
import { post } from '../utils/apiHelpers';

const apiNS = config['api-namespace'];

// We need a separate model here because every operation on this model
// will call the `save` method below, which forces the use of a POST
// to that specific endpoint
export default DS.Model.extend({
  name: DS.attr('string'),
  region: DS.attr('string', { defaultValue: 'nyc1' }),
  ip: DS.attr(),
  targetDropletIds: DS.attr(),
  createdAt: DS.attr('string'),

  save: function(options) {
    const loadBalancer = this.serialize();

    return post(
      `/${apiNS}/load_balancers`,
      _.merge(loadBalancer, options)
    );
  }
});
