import Ember from 'ember';
import App from '../app';
import FormWithValidation from '../components/form-with-validation';

export default FormWithValidation.extend({
  tagName: 'div',
  actions: {
    updateFirstName: function() { this.updateName(); },
    updateLastName: function() { this.updateName(); },
    updatePhoneNumber: function() { this.updateAttribute('phoneNumber'); },
    updateLocation: function() { this.updateAttribute('location'); },
    updateTypeOfTraffic: function() { this.updateAttribute('typeOfTraffic'); },
    updateOtherAccounts: function() { this.updateAttribute('otherAccounts'); },
    updateWhyNewAccount: function() { this.updateAttribute('whyNewAccount'); },
    unauthenticate: function(identity) { this.sendAction('unauthenticate', identity); },
    authenticate: function(identity, provider) { this.sendAction('authenticate', identity, provider); },
    submitSketchyForm: function(e) { this.sendAction('submitSketchyForm', e); },
    deactivate: function() { this.sendAction('deactivate'); },
    clickNoSocialAccount: function() { this.set('noSocialAccount', true); }
  },

  user: App.User,

  // TODO(@jenna): Don't grab from DOM unless changed
  updateName: function() {
    let firstName = this.$('.first-name').val();
    let lastName = this.$('.last-name').val();
    this.model.set('name', `${firstName} ${lastName}`);
  },

  updateAttribute: function(attr) {
    let value = this.$(`.${attr.dasherize()}`).val();
    this.model.set(attr, value);
  },

  isShowingForm: function() {
    return this.get('noSocialAccount') ||
           this.get('data.githubIdentity') ||
           this.get('data.twitterIdentity') ||
           this.get('data.googleIdentity');
  }.property('noSocialAccount', 'data.githubIdentity', 'data.twitterIdentity', 'data.googleIdentity'),

  isOrganization: function() {
    return this.get('user.isOrganizationContext');
  }.property('user.currentContextId'),

  setupForm: function() {
    if (this.get('isShowingForm') === true) {
      this.setup();
    }
  }.observes('isShowingForm'),

  setupOnceDataLoaded: function() {
    if (this.get('loading') === false) {
      Ember.run.scheduleOnce('afterRender', this, () => {
        this.setup();
      });
    }
  }.observes('data')
});
