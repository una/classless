import Ember from 'ember';

export default Ember.Mixin.create({
  _setupAliasesForPagination: function () {
    let modelProp = this.get('modelProperty');
    if(modelProp) {
      let filteredModelProp = this.get('filteredModelProperty');
      this.addObserver(modelProp, function() {
        Ember.defineProperty(this, '_modelMetaAlias', Ember.computed.alias(modelProp + '.meta.pagination'));
        if(filteredModelProp) {
          Ember.defineProperty(this, '_filteredModelAlias', Ember.computed.alias(filteredModelProp));
          let len = this.get('_filteredModelAlias.length');
          this.setProperties({
            '_originalFilteredModelLen': len,
            '_backPagefilteredModelLen': len
          });
        }
      });
    }
  }.on('init'),

  _goBackAPage: function () {
    let len = this.get('_filteredModelAlias.length');
    let lastLen = this.get('_backPagefilteredModelLen');
    //avoid doing this more than once as filteredModel.length fires even when the array doesnt change
    if(len === lastLen) {
      return;
    }
    this.set('_backPagefilteredModelLen', len);
    if(!this.get('_filteredModelAlias.length')) {
      let meta = this.get('_modelMetaAlias');
      if(meta.current_page > 1) {
        this.send('_showLoader');
        this.set('page', meta.current_page - 1);
      } else if(meta.pages > 1) {
        this.send('_reloadModel');
      }
    }
  }.observes('_filteredModelAlias.length', 'page'),

  currentPageVisible: function () {
    let meta = this.get('_modelMetaAlias');
    if(meta.pages === 1) {
      return '';
    }

    let delta = (this.get('_originalFilteredModelLen') || 0) - (this.get('_backPagefilteredModelLen') || 0);
    let startOfPage = meta.offset + 1;
    let endOfPage = meta.offset + (meta.current_page === meta.pages && meta.total % meta.per_page ? meta.total % meta.per_page : meta.per_page) - delta;
    let total = meta.total - delta;
    let range = endOfPage > startOfPage ? ` -  ${endOfPage}` : '';

    return `Viewing ${startOfPage}${range} of ${total}`;
  }.property('_originalFilteredModelLen', '_backPagefilteredModelLen', '_modelMetaAlias')
});
