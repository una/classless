import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';
import {MAX_PERCENTS} from '../constants';

/**
  Example Usage:

  ```
  {{inline-bar-chart
    min=23
    max=42
    value=33
  }}
  ```
 */
export default Ember.Component.extend({
  tagName: 'span',
  classNames: 'inline-bar-chart',

  propTypes: {
    min: PropTypes.number,
    max: PropTypes.number,
    value: PropTypes.number.isRequired
  },

  getDefaultProps: function() {
    return {
      min: 0,
      max: MAX_PERCENTS
    };
  },

  barWidth: function() {
    return MAX_PERCENTS * ( this.get('value') - this.get('min') ) / ( this.get('max') - this.get('min') ); // eslint-disable-line no-magic-numbers
  }.property('min', 'max', 'value'),

  barWidthStyle: function() {
    return Ember.String.htmlSafe(`width: ${this.get('barWidth')}%`);
  }.property('barWidth')

});
