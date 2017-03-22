import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{hoverable-button
    text="Two-factor Authentication"
    defaultClasses="Button--outline Button--green"
    hoverClasses="Button--red"
    click=(action "disable2FA")
    loading=true
  }}
  ```
 */
export default Ember.Component.extend({
  propTypes: {
    text: PropTypes.string.isRequired,
    defaultClasses: PropTypes.string,
    hoverClasses: PropTypes.string,
    click: PropTypes.func.isRequired,
    loading: PropTypes.bool
  },
  mouseEnter: function() {
    this.set('hovered', true);
  },
  mouseLeave: function() {
    this.set('hovered', false);
  },

  actions: {
    click: function() {
      if (!this.get('loading')) {
        this.sendAction('action');
      }
    }
  }
});
