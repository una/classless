import BaseController from '../../base';
import App from '../../../app';

export default BaseController.extend({
  actions: {
    showDestroyModal: function () {
      this.set('showDestroyModal', true);
    },
    onDestroyModalHide: function (confirm) {
      if(confirm) {
        this.get('model.bucket')
          .destroyRecord()
          .then(() => {
            App.NotificationsManager.show('Your bucket has been deleted', 'notice');
            this.transitionToRoute('spaces', { queryParams: {
              sort: 'created_at',
              sort_direction: 'desc',
              page: 1
            }});
          })
          .catch((err) => {
            this.errorHandler(err);
            this.get('model.bucket').rollbackAttributes();
          })
          .finally(() => {
            this.set('isDeleting', false);
          });
      }
      this.setProperties({
        showDestroyModal: false,
        isDeleting: confirm
      });
    }
  }
});
