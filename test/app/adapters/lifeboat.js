import ENV from '../config/environment';
import ApplicationActiveModelAdapter from '../adapters/application';

export default ApplicationActiveModelAdapter.extend({
  namespace: `${ENV['api-namespace']}/help`,
  host: ENV['api-host'],
  coalesceFindRequests: true
});