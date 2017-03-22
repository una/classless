import Ember from 'ember';

/* eslint-disable no-magic-numbers */
const CHECK_INTERVAL_RANGE = [3, 300];
const RESPONSE_TIMEOUT_RANGE = [3, 300];
const UNHEALTHY_THRESHOLD_RANGE = [2, 10];
const HEALTHY_THRESHOLD_RANGE = [2, 10];
/* eslint-enable no-magic-numbers */

export default Ember.Component.extend({
  isEditMode: false,

  validateCheckInterval: function(interval) {
    interval = parseInt(interval, 10);
    return (interval >= CHECK_INTERVAL_RANGE[0])
      && (interval <= CHECK_INTERVAL_RANGE[1]);
  },

  setCheckIntervalErrorMessage: function(interval) {
    return interval > CHECK_INTERVAL_RANGE[1]
      ? `Must be ${CHECK_INTERVAL_RANGE[1]}s or less`
      : `Must be ${CHECK_INTERVAL_RANGE[0]}s or more`;
  },

  validateResponseTimeout: function(timeout) {
    timeout = parseInt(timeout, 10);
    return (timeout >= RESPONSE_TIMEOUT_RANGE[0])
      && (timeout <= RESPONSE_TIMEOUT_RANGE[1]);
  },

  setResponseTimeoutErrorMessage: function(timeout) {
    return timeout > RESPONSE_TIMEOUT_RANGE[1]
      ? `Must be ${RESPONSE_TIMEOUT_RANGE[1]}s or less`
      : `Must be ${RESPONSE_TIMEOUT_RANGE[0]}s or more`;
  },

  validateUnhealthyThreshold: function(threshold) {
    threshold = parseInt(threshold, 10);
    return (threshold >= UNHEALTHY_THRESHOLD_RANGE[0])
      && (threshold <= UNHEALTHY_THRESHOLD_RANGE[1]);
  },

  setUnhealthyThresholdErrorMessage: function(threshold) {
    return threshold > UNHEALTHY_THRESHOLD_RANGE[1]
      ? `Must be ${UNHEALTHY_THRESHOLD_RANGE[1]} or less`
      : `Must be ${UNHEALTHY_THRESHOLD_RANGE[0]} or more`;
  },

  validateHealthyThreshold: function(threshold) {
    threshold = parseInt(threshold, 10);
    return (threshold >= HEALTHY_THRESHOLD_RANGE[0])
      && (threshold <= HEALTHY_THRESHOLD_RANGE[1]);
  },

  setHealthyThresholdErrorMessage: function(threshold) {
    return threshold > HEALTHY_THRESHOLD_RANGE[1]
      ? `Must be ${HEALTHY_THRESHOLD_RANGE[1]} or less`
      : `Must be ${HEALTHY_THRESHOLD_RANGE[0]} or more`;
  }
});
