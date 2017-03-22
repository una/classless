import Ember from 'ember';
import _ from 'lodash/lodash';

const HOVER_TIME = 300;

export default Ember.Component.extend({
  tagName: 'tr',
  classNameBindings: ['selected', 'newFile'],

  selected: Ember.computed.alias('item.isSelected'),
  newFile: Ember.computed.alias('item.newFile'),

  myId: function () {
    return 'row-' + Ember.guidFor(this);
  }.property(),

  isEditable: function () {
    return this.get('item.isDir');
  }.property('item'),

  metadata: function () {
    let meta = this.get('item.metadata');
    return _.extend({
      'Permission': meta.acl === 'public-read' ? 'Public' : 'Private',
      'Content-Type': meta.contentType,
      'Cache-Control': meta.cacheControl,
      'Content-Encoding': meta.contentEncoding,
      'Content-Disposition': meta.contentDisposition
    }, this.get('item.metadata.customMetadata').reduce(function(obj, meta) {
      obj[meta.key] = meta.value;
      return obj;
    }, {}));
  }.property('item.metadata.contentType', 'item.metadata.acl', 'item.metadata.cacheControl', 'item.metadata.contentEncoding', 'item.metadata.contentDisposition', 'item.metadata.customMetadata.@each.key', 'item.metadata.customMetadata.@each.value', 'item.metadata.customMetadata.[]'),

  setup: function () {
    if(this.get('item.isDir')) {
      return;
    }

    let selector = 'td:first-of-type .Resource';
    this.$().on('mouseover', selector, () => {
      if(this.get('item.isRenaming')) {
        return;
      }
      if(this.get('item.metadata')) {
        return this.set('showInfo', true);
      }
      this.hoverTimeout = Ember.run.later(() => {
        if(this.get('item.isRenaming')) {
          return;
        }
        this.set('showInfo', true);
        this.sendAction('getMetaData', this.get('item'));
      }, HOVER_TIME);
    }).on('mouseout', selector, () => {
      this.set('showInfo', false);
      Ember.run.cancel(this.hoverTimeout);
    });
  }.on('didInsertElement'),

  teardown: function () {
    Ember.run.cancel(this.hoverTimeout);
    this.$().off('mouseover mouseout');
  }.on('willDestroyElement'),

  mouseDown(e) {
    let didntClickOnRowAction = this.$(e.target).closest('a, .aurora-dropdown-menu').length === 0;
    if(didntClickOnRowAction && this.get('selectItem')) {
      this.sendAction('selectItem', e, this.get('item'), this.get('index'));
    }
  },

  actions: {

    submitEdit(name, origContext) {
      if (this.get('submitEdit')) {
        this.sendAction('submitEdit', name, origContext, this.get('item'));
      }
    },

    cancelEdit(origContext, e, item, curContext) {
      if (this.get('cancelEdit')) {
        this.sendAction('cancelEdit', item, e, curContext);
      }
    },

    menuItemClick(item, file) {
      if (this.get('menuItemClick')) {
        this.sendAction('menuItemClick', item, file);
      }
    },

    openDir() {
      if (this.get('openDir')) {
        this.sendAction('openDir', this.get('item.name'));
      }
    },

    editName() {
      if (this.get('editName')) {
        this.sendAction('editName', this.get('item.key'));
      }
    },

    updatePermissions() {
      if(this.get('updatePermissions')) {
        this.sendAction('updatePermissions', this.get('item'), this.get('acl'));
      }
    },

    deleteItem() {
      if(this.get('deleteItem')) {
        this.sendAction('deleteItem', this.get('item'));
      }
    }

  }
});
