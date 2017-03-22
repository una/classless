import Ember from 'ember';
import {
  COLLECTING_METRICS,
  COLLECTING_DROPLET_METRICS_TOOLTIP_TEXT
} from '../../constants';

export default Ember.Component.extend({
  collectingMetrics: COLLECTING_METRICS,
  collectingDropletMetricsTooltipText: COLLECTING_DROPLET_METRICS_TOOLTIP_TEXT,

  showActionDropdown: true,

  actions: {
    actionMenuItemClick: function(name, params) {
      if (this.get('actionMenuItemClick')) {
        this.sendAction('actionMenuItemClick', name, params);
      }
    }
  }
});
