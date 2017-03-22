import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  tooltips: {
    private_networking: 'Adds Droplet-to-Droplet networking, within the same region.',
    ipv6: 'Enables public IPv6 networking.',
    backups: 'Enables weekly backups. Each backup is retained for four weeks. Adds 20% to monthly Droplet cost.',
    install_agent: 'Enables additional Droplet metrics collection, monitoring, and alerting.',
    metadata: 'Allows the use of Cloud-Init to configure your Droplet.',
    required: 'This feature is required for this image.',
    nonSupported: 'This feature is not supported with these options.'
  },

  features: function() {
    let options = this.get('options'),
        tooltip;

    options.forEach((option) => {
      tooltip = this.get('tooltips.' + option.id);

      // required feature
      if(option.checked && option.isDisabled) {
        tooltip += ' ' + this.get('tooltips.required');
      }

      // non-supported feature
      if(!option.checked && option.isDisabled) {
        tooltip += ' ' + this.get('tooltips.nonSupported');
      }

      Ember.setProperties(option, {
        inputId: 'option-' + option.id,
        tooltip: tooltip
      });
    });

    return options;
  }.property('options', 'options.@each.checked', 'options.@each.isDisabled'),

  onChange: function() {
    if(this.get('onSelect')) {
      let selectedFeatures = _.filter(this.get('features'), (feature) => {
        return feature.checked;
      });
      this.sendAction('onSelect', selectedFeatures);
    }
  }.observes('features.@each.checked')
});
