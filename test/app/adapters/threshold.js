import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  namespace: ``,

  urlForFindRecord: function(id) {
    return `${this.get('host')}/api/v1/monitors/thresholds/${id}`;
  },

  urlForFindAll: function() {
    return `${this.get('host')}/api/v1/monitors/thresholds`;
  },

  urlForCreateRecord: function() {
    return `${this.get('host')}/api/v1/thresholds`;
  },

  urlForDeleteRecord: function(id) {
    return `${this.get('host')}/api/v1/thresholds/${id}`;
  },

  urlForUpdateRecord: function(id) {
    return `${this.get('host')}/api/v1/thresholds/${id}`;
  }
});
