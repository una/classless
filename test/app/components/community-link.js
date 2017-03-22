import Ember from 'ember';

/**
 * Usage:
 * {{#community-link slug="my-tutorial-slug"}}link description{{/community-link}}
 */

export default Ember.Component.extend({
  tagName: 'a',
  classNames: ['is-community-link'],
  classNameBindings: ['class'],
  didInsertElement: function() {
    let slug = this.get('slug'),
        url = '//www.digitalocean.com/community',
        path = slug ? ['tutorials', slug].join('/') : '';

    this.$().attr({
      'target': '_blank',
      'href': [url, path].join('/'),
      'rel': 'noopener noreferrer'
    });
  }
});
