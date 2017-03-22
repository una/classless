import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  namespace: `api/v1/monitors`,

  buildURL() {
    return `${this.host}/${this.namespace}/active_alerts`;
  }

});
