import Ember from 'ember';
import App from '../../app';
import {CURRENCY_USD_PRECISION} from '../../constants';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      referralInvites: App.User.fetchReferralInvites(),
      stats: App.User.fetchReferralStats()
    });
  },
  setupController: function(controller, model) {
    model.stats.pending = model.stats && model.stats.pending ? model.stats.pending.toFixed(CURRENCY_USD_PRECISION) : '0.00';
    model.stats.earned = model.stats && model.stats.earned ? model.stats.earned.toFixed(CURRENCY_USD_PRECISION) : '0.00';
    model.stats.paid = model.stats && model.stats.paid ? model.stats.paid.toFixed(CURRENCY_USD_PRECISION) : '0.00';



    controller.setProperties({
      referralLimit: model.referralInvites.send_limit_remaining,
      stats: model.stats,
      isPaypalPayout: model.stats.payout_method_paypal
    });
  },
  actions: {
    authenticate: function(provider) {
      let controller = this.controllerFor('settings.referrals');
      this.get('torii').open(provider).then(function() {
        controller.set('isGmailAuthenticated', true);
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
