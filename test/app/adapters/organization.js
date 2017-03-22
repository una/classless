import AppRestAdapter from '../adapters/application';

export default AppRestAdapter.extend({
  pathForType: function() {
    return 'teams';
  }
});
