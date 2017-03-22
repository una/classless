import Ember from 'ember';
import validatePortRange from '../../utils/validatePortRange';
import { PORT_RANGE } from '../../constants';

const AVAILABLE_PROTOCOLS = [
  'TCP',
  'HTTP'
];

const HTTP_PORT = 80;
const DEFAULT_PATH = '/';

export default Ember.Component.extend({
  isEditMode: false,

  availableProtocols: AVAILABLE_PROTOCOLS,

  validatePortRange: validatePortRange,

  setPortRangeErrorMessage: function(port) {
    return port > PORT_RANGE[1]
      ? `Must be ${PORT_RANGE[1]} or less`
      : `Must be ${PORT_RANGE[0]} or more`;
  },

  validatePath: function(path) {
    // Adapted from http://stackoverflow.com/a/3809435/349353
    return /^([-a-zA-Z0-9@:%_\+.~#?&/=]*)$/i.test(path);
  },

  pathVisible: function() {
    return this.get('selectedProtocol') !== 'TCP';
  }.property('selectedProtocol'),

  actions: {
    onProtocolChange: function(e) {
      const protocol = e.target.value;

      if (protocol === 'HTTP') {
        this.set('port', HTTP_PORT);

        if (this.get('path') === '') {
          this.set('path', DEFAULT_PATH);
        }
      }
    },

    onProtocolFocus: function() {
      if (this.get('onProtocolFocus')) {
        this.sendAction('onProtocolFocus');
      }
    }
  }
});
