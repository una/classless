  import Ember from 'ember';
import ClickAway from '../mixins/click-away';
import DomainRecord from '../mixins/domain-record';

export default Ember.Component.extend(ClickAway, DomainRecord, {
  tagName: 'tr',
  classNameBindings: ['isEditing', 'recordTypeClass', 'hasPriority'],
  menuItems: [
    {name: 'Edit record'},
    {name: 'Delete'}
  ],
  acIpAddress: null,

  editOnClick: false,
  clickAwayOnEsc: true,

  unsafeEdit: function () {
    return this.get('editingRecord') !== this.get('record.id');
  }.property('editingRecord', 'record'),

  clickAway: function(e) {
    if(this.get('isEditing') && (!this.get('hasEdited') || e.keyCode)) {
      this.set('isEditing', false);
    }
  },

  disableEditingMode: function () {
    if(this.get('unsafeEdit')) {
      this.set('isEditing', false);
    }
  }.observes('editingRecord'),

  recordIsSaving: function () {
    if(!this.get('record.isSaving') && !this.get('record.hasDirtyAttributes') && !this.get('record.isError')) {
      this.set('isEditing', false);
    }
  }.observes('record.isSaving'),

  click: function (event) {
    if(!this.get('editOnClick') || this.get('isEditing')) {
      return;
    }
    let $target = this.$(event.target);
    let priority = $target.closest('.priority')[0];
    let td = $target.closest('td.editable')[0];
    if(td) {
      let tdClass = td.classList[0];
      let inputToFocusSelector = '.' + tdClass + ' input, .' + tdClass + ' textarea';
      if(priority) {
        inputToFocusSelector = '.text-priority input';
      }
      this.enableEditingMode(inputToFocusSelector);
    }
  },

  input: function () {
    this.set('hasEdited', true);
  },

  enableEditingMode: function (inputToFocusSelector) {
    this.sendAction('resetAutoComplete', this.get('autoCompleteName'));
    Ember.run.next(() => {
      this.setProperties({
        isEditing: true,
        hasEdited: false
      });
      let recordType = this.get('record.recordType');
      let item = this.get('record.droplet.content') || this.get('record.floatingIp.content');
      if(item && recordType === 'A') {
        this.set('acIpAddress', item.get('ipAddress'));
      } else if(item && recordType === 'AAAA') {
        this.set('acIpAddress', item.get('publicIpv6'));
      }

      if(inputToFocusSelector) {
        Ember.run.next(() => {
          this.$(inputToFocusSelector).focus();
        });
      }
      this.sendAction('setEditingRecord', this.get('record.id'));
    });
  },

  actions: {
    onRowSave: function () {
      let rec = this.get('record');
      let inputText;
      this.get('valueItems').forEach((value) => {
        if(value.autoComplete) {
          if(this.$('.aurora-auto-complete .Resource.selected').length) {
            rec.set(value.key, this.get('acIpAddress'));
          } else {
            inputText = this.$('.aurora-auto-complete .FloatLabel-input').val();
            rec.set(value.key, inputText);
          }
        } else {
          inputText = this.$('.key-' + value.key + ' input, .key-' + value.key + ' textarea').val();
          rec.set(value.key, inputText);
        }
        if(value.FQDN && !value.value.match('^@$|\\.$')){
          rec.set(value.key, value.value + '.');
        }
      });
      rec.set('ttl', this.$('.ttl input').val());
      this.sendAction('saveRecord', rec);
    },

    onSelectItem: function (item) {
      let ip = item.get('ipAddress');
      if (this.get('record.recordType') === 'AAAA') {
        ip = item.get('publicIpv6');
      }
      this.setProperties({
        acIpAddress: ip,
        hasEdited: true
      });
    },

    menuItemClick: function(clickedKey) {
      if(clickedKey === 'Edit record') {
        this.enableEditingMode();
      }
    },

    deleteRecord: function() {
      this.sendAction('deleteRecord', this.get('record'));
    }

  }
});
