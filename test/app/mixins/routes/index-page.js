import Ember from 'ember';

export default Ember.Mixin.create({
  model: function(params, transition) {
    this.showLoader = this.showLoader || !!transition.queryParams.pendingSave;
    if(transition.queryParams.pendingSave) {
      return transition.queryParams.pendingSave.then(this.getModel.bind(this, params));
    }
    return this.getModel(params);
  },

  _initRoute: function() {
    this.isInitialLoad = !this.showLoader;
  }.on('deactivate', 'init'),

  actions: {
    loading: function() {
      return this.isInitialLoad || this.showLoader;
    },

    _showLoader: function () {
      this.showLoader = true;
    },

    didTransition: function () {
      this.showLoader = false;
    },

    _reloadModel: function() {
      this.showLoader = true;
      this.refresh();
    }
  }

});
