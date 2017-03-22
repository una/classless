import BaseController from '../controllers/base';
import retrieveCsrfToken from '../utils/retrieveCsrfToken';

export default BaseController.extend({
  setup: function() {
    this.csrfToken = retrieveCsrfToken();
  }.on('init')
});
