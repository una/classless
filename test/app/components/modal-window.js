import Ember from 'ember';

export default Ember.Component.extend({
  attributeBindings: ['role', 'tabIndex'],
  classNames: ['Modal', 'fade'],
  classNameBindings: ['modalSizeClass'],
  saveClasses: 'Button--blue',

  hasShowNoMore: false,

  role: 'dialog',
  tabIndex: '0', //need this to capture keyboard input ('esc' key for close)

  setup: function () {
    let $modal = this.$().Modal();
    $modal.on('hidden.bs.modal', () => {
      //let save action run before this
      Ember.run.next(() =>{
        if(this.get('onHide')) {
          this.sendAction('onHide', this.get('save'), this);
        }
        $modal.data('bs.modal', null).off('hide.bs.modal shown.bs.modal'); //destroy the modal
      });
    }).on('shown.bs.modal', () => {
      if(!this.get('disableFirstInputFocus')) {
        let input = this.$('input, textarea');
        if (input.length > 0) {
          this.$('input, textarea').first().focus();
        }
      }
      if(this.get('onShow')) {
        this.sendAction('onShow', null, this);
      }
    });
  }.on('didInsertElement'),

  teardown: function () {
    let $elt = this.$();
    if($elt) {
      $elt.Modal('hide');
    }
  }.on('willDestroyElement'),

  saveText: function () {
    return this.get('saveButtonText') || 'Save';
  }.property('saveButtonText'),

  cancelText: function () {
    return this.get('cancelButtonText') || 'Cancel';
  }.property('cancelButtonText'),

  showSave: function () {
    return this.get('showSaveButton') !== false;
  }.property('showSaveButton'),

  showCancel: function () {
    return this.get('showCancelButton') !== false;
  }.property('showCancelButton'),

  titleText: function() {
    return this.get('title') || '';
  }.property('title'),

  modalSize: function () {
    this.set('modalSizeClass', 'Modal--' + (this.get('size') || 'medium'));
  }.observes('size').on('init'),

  actions: {
    save: function () {
      this.set('save', true);
    }
  }

});
