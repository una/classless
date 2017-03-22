import _ from 'lodash/lodash';
import Ember from 'ember';

const ALGORITHMS = [
  {
    value: 'ROUND_ROBIN',
    label: 'Round Robin',
    tooltipText: 'Incoming requests are split evenly across backend Droplets.'
  },
  {
    value: 'LEAST_CONNECTIONS',
    label: 'Least Connections',
    tooltipText: 'Incoming requests are routed to the Droplet with the least amount of open connections.'
  }
];

const algorithmMap = _.indexBy(ALGORITHMS, 'value');

export default Ember.Component.extend({
  isEditMode: false,

  availableAlgorithms: ALGORITHMS,

  algorithmDisplayName: function() {
    return algorithmMap[this.get('selectedAlgorithm')].label;
  }.property('selectedAlgorithm'),

  actions: {
    onAlgorithmSelect: function(algorithm) {
      if (this.get('onAlgorithmSelect')) {
        this.sendAction('onAlgorithmSelect', algorithm);
      }
    }
  }
});
