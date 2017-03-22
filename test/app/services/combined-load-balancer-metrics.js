import Ember from 'ember';
import { get } from '../utils/apiHelpers';
import ENV from '../config/environment';

export default Ember.Service.extend({
  getMetricsForLoadBalancers: function(loadBalancerIds, type, period) {
    const filteredPeriod = period === 'hour' ? '6hour' : period;
    const formattedIds = loadBalancerIds.map((id) => `load_balancer_ids[]=${id}`).join('&');
    const uri = `/${ENV['api-namespace']}/load_balancers/combined_metrics/${type}?${formattedIds}&period=${filteredPeriod}`;

    return get(uri)
      .then((resp) => resp.json())
      .catch(() => []);
  }
});
