import Ember from 'ember';
import ClickAway from '../mixins/click-away';
import ENV from '../config/environment';
import App from '../app';

export default Ember.Component.extend(ClickAway, {

  clickAway: function () {
    this.set('showFeedback', false);
  },

  actions: {
    showFeedback: function () {
      this.$('input, textarea').first().focus();
      this.setProperties({
        showFeedback: true,
        success: false
      });
    },
    closeModal: function () {
      this.set('showFeedback', false);
    },
    sendFeedback: function () {
      const TRANSITION_TIME = 300;
      Ember.$.ajax({
        type: 'POST',
        accept: {
          javascript: 'application/javascript'
        },
        url: ENV['form-keep']['FORM_KEEP_URL'],
        data: '?utf8=✓&wish=' + this.get('feedback')
      })
      .done(() => {
        this.set('success', true);
        Ember.run.later(() => {
          this.set('feedback', '');
          if(!this.get('isDestroyed') && !this.get('isDestroying')) {
            this.$('.FloatLabel').removeClass('is-active');
          }
        }, TRANSITION_TIME);
      })
      .fail(function() {
        App.NotificationsManager.show('Sorry, your feedback could not be sent', 'alert');
      })
      .always(() => {
        this.set('saving', false);
      });
      this.set('saving', true);
    }
  }
});
