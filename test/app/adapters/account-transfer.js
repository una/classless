import AppRestAdapter from '../adapters/application';
import ENV from '../config/environment';

export default AppRestAdapter.extend({
  namespace: ENV['api-namespace'] + '/images'
});