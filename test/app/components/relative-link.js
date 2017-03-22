import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{relative-link
    shortContextId="foo"
    href="bar"
    target="_blank"
    rel="noopener noreferrer"
  }}
  ```
 */
export default Ember.Component.extend({
  tagName: 'a',
  classNames: [],
  attributeBindings: ['target', 'rel'],
  propTypes: {
    shortContextId: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    target: PropTypes.string,
    rel: PropTypes.string
  },

  didInsertElement: function() {
    this.$().attr({
      href: this.get('generatedRelativeLink')
    });
  },

  generatedRelativeLink: Ember.computed('shortContextId', 'href', function() {
    return `${this.get('href')}?i=${this.get('shortContextId')}`;
  })
});
