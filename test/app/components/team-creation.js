import Ember from 'ember';
import {RADIX} from '../constants';

const INTRO_STEP = 1;
const BILLING_STEP = 2;
const INVITATION_STEP = 3;
const LAST_STEP = 4;

export default Ember.Component.extend({
  step: 1,
  isSubmittingInvites: false,
  isSubmittingSkipInvites: false,

  setup: function() {
    this.fetchesForStep();
  }.on('didInsertElement'),

  paypalReturnURL: function() {
    return document.location.href;
  }.property('orgName', 'orgSlug', 'orgEmail'),

  fetchesForStep: function() {
    let step = window.parseInt(this.get('step'), RADIX);
    if(!step || step === 0 || step > LAST_STEP) {
      this.set('step', INTRO_STEP);
    } else if(step === BILLING_STEP) {
      // validate that we have the required props before showing step 2
      if(this.get('orgName') && this.get('orgSlug') && this.get('orgEmail')) {
        if(this.get('fetchCreditCards')) {
          this.sendAction('fetchCreditCards');
        }
      } else {
        this.set('step', INTRO_STEP);
      }
    } else if(step === INVITATION_STEP) {
      if(this.get('isFree')) {
        if(!this.get('orgName') || !this.get('orgSlug') || !this.get('orgEmail')) {
          this.set('step', INTRO_STEP);
        }
      } else {
        // validate that we have the required props before showing step 3
        if(!this.get('isFree') && !this.get('selectedCreditCard') && !this.get('credits') && !this.get('bankAccount.isSelected')) {
          this.set('step', BILLING_STEP);
        }
      }
    } else if(step === LAST_STEP) {
      if(this.get('isSubmittingSkipInvites') || this.get('isSubmittingInvites')) {
        this.setProperties({
          isSubmittingInvites: false,
          isSubmittingSkipInvites: false
        });
      } else {
        this.set('step', INVITATION_STEP);
      }
    }
  }.observes('step'),

  observeSubmit: function() {
    if(!this.get('isSubmitting')) {
      this.setProperties({
        isSubmittingSkipInvites: false,
        isSubmittingInvites: false
      });
    }
  }.observes('isSubmitting'),

  actions: {
    onSubmitTeamName: function() {
      this.setProperties({
        step: BILLING_STEP
      });
    },
    onSubmitBilling: function() {
      this.set('step', INVITATION_STEP);
    },
    onSubmitInvites: function(invites) {
      this.setProperties({
        invites: invites,
        isSubmittingInvites: Boolean(invites.length)
      });

      this.send('onSubmit');
    },
    onSkipInvites: function() {
      this.set('isSubmittingSkipInvites', true);
      this.send('onSubmitInvites', []);
    },
    onSubmit: function() {
      if(this.get('onSubmit')) {
        this.sendAction('onSubmit', this.get('invites'));
      }
    },
    onValidateSlug: function(slug) {
      if(this.get('onValidateSlug')) {
        this.sendAction('onValidateSlug', slug);
      }
    },
    authenticateGmail: function() {
      if(this.get('authenticateGmail')) {
        this.sendAction('authenticateGmail');
      }
    },
    navigateToTeamsPage: function() {
      if(this.get('navigateToTeamsPage')) {
        this.sendAction('navigateToTeamsPage');
      }
    },
    setStep: function(val) {
      let step = this.get('step');
      if(val < step) {
        this.set('step', val);
      }
    },
    onPaypalSubmit: function() {
      if (this.get('onPaypalSubmit')) {
        this.sendAction('onPaypalSubmit');
      }
    }
  }
});
