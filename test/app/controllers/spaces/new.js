import BaseController from '../base';
import ENV from '../../config/environment';
import App from '../../app';

export default BaseController.extend({
  bucketLocation: ENV.APP.bucketLocation,
  region:  ENV.APP.bucketRegion,

  actions: {
    onInput: function (val, isValid) {
      this.set('validName', isValid ? val.toLowerCase() : null);
    },
    reset: function () {
      this.setProperties({
        name: '',
        validName: '',
        isCreating: false,
        corsIsChecked: true,
        radioValue: 'public-read'
      });
    },
    onSubmit: function () {
      this.set('isCreating', true);

      this.store.createRecord('bucket', {
        name: this.get('name'),
        acl: this.get('radioValue'),
        cors: this.get('corsIsChecked'),
        region: this.region
      })
        .save()
        .then((bucket) => {
          App.NotificationsManager.show('Your bucket has been created', 'notice');
          this.transitionToRoute('spaces.show', bucket.id);
        })
        .catch((err) => {
          this.set('isCreating', false);
          this.errorHandler(err);
        });
    },
    aclChanged: function () {}, //partial uses this action, do nothing here
    corsChanged: function () {} //partial uses this action, do nothing here
  }
});
