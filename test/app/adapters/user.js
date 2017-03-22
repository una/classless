import ENV from '../config/environment';
import AppRestAdapter from '../adapters/application';

export default AppRestAdapter.extend({
  sendRequestTracing: ENV.environment !== 'development'
});
