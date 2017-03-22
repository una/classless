import Ember from 'ember';
import App from '../app';
import {slugify} from '../helpers/slugify';
import {DEBOUNCE_AMOUNT} from '../constants';

const MAX_TEAM_NAME_LENGTH = 30;

export default Ember.Component.extend({
  maxTeamNameLength: MAX_TEAM_NAME_LENGTH,
  defaultSlugError: 'Invalid slug',

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      this.set('orgEmail', App.User.get('email'));
      this.setSlugError();
    });
  }.on('didInsertElement'),

  orgNameToSlug: function() {
    this.set('orgSlug', slugify(this.get('orgName')));
  }.observes('orgName'),

  checkIfValidSlug: function() {
    let slug = this.get('orgSlug');

    if(slug) {
      slug = slug.trim();
    }

    if(slug && this.get('onValidateSlug')) {
      this.sendAction('onValidateSlug', slug);
    }
  },

  validateSlugInput: function() {
    // retrigger validation if invalidSlugs array changed
    // this typically means the latest slug was invalid and the
    // input field should show that in immediately
    Ember.run.next(() => {
      this.$('.js-team-name-input-slug').trigger('validate');
    });
  }.observes('invalidSlugs.length'),

  slugPattern: function() {
    let invalidSlugs = this.get('invalidSlugs') || [];
    let validSlugRegex = '(^[a-z0-9]+[a-z0-9-]+[a-z0-9]+)$';

    // add invalid slugs to the regex to force the input to be invalid
    if(invalidSlugs.length) {
      validSlugRegex = '(?!^(' + invalidSlugs.join("|") + ')$)' + validSlugRegex;
    }
    return validSlugRegex;
  }.property('invalidSlugs'),

  setSlugError: function() {
    let error = this.get('defaultSlugError');

    if(this.get('orgSlug') && !this.get('isSlugValid')) {
      error = 'URL already taken';
    }

    this.set('slugError', error);
  }.observes('isSlugValid', 'orgSlug'),

  validateSlug: function() {
    let slug = this.get('orgSlug');
    if(slug && slug.trim()) {
      Ember.run.debounce(this, this.checkIfValidSlug, DEBOUNCE_AMOUNT);
    }
  }.observes('orgSlug'),

  actions: {
    onSubmit: function() {
      if(!this.get('orgSlug')) {
        this.orgNameToSlug();
      }
      if(this.get('onSubmitTeamName')) {
        this.sendAction('onSubmitTeamName');
      }
    }
  }
});
