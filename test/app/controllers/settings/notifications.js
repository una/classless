import BaseController from '../../controllers/base';

export default BaseController.extend({
  init: function() {
    this.set('isFirstTime', true);
  },

  toggleSubscription: function() {
    if(this.get('isFirstTime')) {
      this.set('isFirstTime', false);
      return;
    }

    this.set('isSaving', true);
    this.get('model').save().catch((err) => {
      this.errorHandler(err, 'Updating email subscription');
    }).finally(() => {
      this.set('isSaving', false);
    });
  }.observes('model.newsletterSubscribed')
});