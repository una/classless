import Ember from 'ember';
import {
  METRIC_UNAVAILABLE,
  COLLECTING_METRICS,
  METRIC_LOADING,
  COLLECTING_METRICS_TOOLTIP_TEXT
} from '../../constants';

export default Ember.Component.extend({
  tagName: 'tr',

  metricUnavailable: METRIC_UNAVAILABLE,
  collectingMetrics: COLLECTING_METRICS,
  metricLoading: METRIC_LOADING,
  collectingMetricsTooltipText: COLLECTING_METRICS_TOOLTIP_TEXT,

  actions: {
    onCreateComplete: function() {
      if (this.get('onCreateComplete')) {
        this.get('onCreateComplete')();
      }
    },

    onCreateError: function() {
      if (this.get('onCreateError')) {
        this.get('onCreateError')();
      }
    },

    onMenuItemClick: function(name) {
      if (this.get('onMenuItemClick')) {
        this.get('onMenuItemClick')(name);
      }
    }
  }
});
