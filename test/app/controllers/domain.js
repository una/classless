import Ember from 'ember';
import AutoCompleteController from './autocomplete';
import DomainRecord from '../mixins/domain-record';
import App from '../app';

export default AutoCompleteController.extend(DomainRecord, {
  disabledAutoCompleteItems: [],
  editingRecord: false,

  filteredRecords: function () {
    return this.get('model.domainRecords').filter((rec) => {
      return rec.get('recordType') !== 'SOA';
    }).map((rec) => {
      if((rec.get('recordType') === 'CNAME' || rec.get('recordType') === 'MX' || rec.get('recordType') === 'NS') && (!rec.get('dataRecord').match(/\.$/))){
        rec.set('dataRecord', rec.get('dataRecord') + '.');
      }
      return rec;
    }).concat(this.get('newRecords').filter((a) => {
      return a.get('isDirty') || a.get('isSaving') || !a.get('isDeleted');
    })).sort((a, b) => b.get('createdAt') - a.get('createdAt'));

  }.property('model.domainRecords', 'newRecord', 'model.domainRecords.@each.dataRecord', 'newRecords.@each.dataRecord', 'newRecords.@each.isDeleted'),

  formInputItems: function () {
    if(this.get('record.recordType') === 'TXT') {
      return this.get('valueItems').concat(this.get('hostNameItems')).concat(this.get('ttlItems'));
    }
    return this.get('hostNameItems').concat(this.get('valueItems')).concat(this.get('ttlItems'));
  }.property('record', 'hostNameItems', 'valueItems', 'ttlItems'),

  formInputHostNameItem: function () {
    return this.get('formInputItems').objectAt(this.get('record.recordType') === 'TXT' ? 1 : 0);
  }.property('formInputItems'),

  disabledAutoCompleteAAAAItems: function () {
    return this.getDisabledItems(this.get('autoCompleteAAAAItems'));
  }.property('autoCompleteAAAAItems'),

  disabledAutoCompleteFormAAAAItems: function () {
    return this.getDisabledItems(this.get('autoCompleteFormAAAAItems'));
  }.property('autoCompleteFormAAAAItems'),

  cleanupNewDomains: function() {
    this.set('newDomains', []);
  }.observes('domains'),

  getDisabledItems: function (items) {
    let indicies = [];
    items.forEach(function (model, index) {
      if(!model.get('publicIpv6')) {
        indicies.push({ index: index, reason: 'Droplet does not have an IPV6 address'});
      }
    });
    return indicies;
  },

  ttlItems: function () {
    return this._super().map(function (ttl) {
      ttl.value = ttl.defaultValue;
      return ttl;
    });
  }.property('record', 'recordTab'),

  hostNameItems: function () {
    return this._super().map(function (item) {
      if(item.hasDefault) {
        item.value = '@';
      }
      return item;
    });
  }.property('record', 'recordTab'),

  cleanupNewRecords: function() {
    this.setProperties({
      'newRecords': [],
      'newRecord': null
    });
  }.observes('model.domainRecords'),

  resetTabForm: function(tab) {
    this.setProperties({
      record: Ember.Object.create({
        recordType: tab
      }),
      recordTab: tab
    });
  },

  actions: {
    changeRecordTab: function (tab) {
      if(tab === 'A') {
        this.send('resetAutoComplete', 'autoCompleteForm');
      } else if (tab === 'AAAA') {
        this.send('resetAutoComplete', 'autoCompleteFormAAAA');
      }
      this.resetTabForm(tab);
    },

    resetAutoComplete: function () {
      return true;
    },

    _ac_onInput: function (...args) {
      this._super(...args);
    },

    createRecord: function () {
      let newRecords = this.get('newRecords');
      let record = this.get('store').createRecord('domainRecord', {
        recordType: this.get('record.recordType')
      });
      this.set('saving', true);
      this.get('formInputItems').forEach( (item) => {
        if(item.FQDN && !item.value.match('^@$|\\.$')){
          Ember.set(item, 'value', item.value + '.');
        }
        if(item.autoComplete) {
          if(Ember.$('.aurora-auto-complete .Resource.selected').length) {
            record.set(item.key, this.get('acIpAddress'));
          } else {
            let inputText = Ember.$('.aurora-auto-complete .FloatLabel-input').val();
            record.set(item.key, inputText);
          }
        } else {
          record.set(item.key, item.value);
        }

      });

      record.save({
        adapterOptions: {
          domainId: this.get('model.id')
        }
      }).then(() => {
        App.NotificationsManager.show(record.get('recordType') + ' record created successfully!', 'notice');
        newRecords.unshift(record);
        this.setProperties({
          newRecords: newRecords,
          newRecord: record
        });
        this.resetTabForm(this.get('recordTab'));
      }).catch((error) => {
        this.set('newRecord', null);
        this.errorHandler(error);
      }).finally(() => {
        this.set('saving', false);
      });
    },

    saveRecord: function (record) {
      this.set('savingRecord', true);
      record.save({
        adapterOptions: {
          domainId: this.get('model.id')
        }
      }).then((data) => {
        App.NotificationsManager.show(data.get('recordType') + ' record updated successfully', 'notice');
        this.set('editingRecord', false);
      }).catch((error) => {
        this.errorHandler(error);
      }).finally(() => {
        this.set('savingRecord', false);
      });
    },

    addMxRecords: function (type) {
      this.set('savingMxRecords', true);
      return this.get('model').addMxRecords(type).then( () => {
        type = type.split('_').map(function (str) {
          if(str.match(/^mx$/i)) {
            return 'MX';
          }
          return str.charAt(0).toUpperCase() + str.slice(1);
        }).join(' ');
        return this.get('model').reload().then(function () {
          App.NotificationsManager.show(type + ' created successfully!', 'notice');
        });
      }).catch( (err) => {
        this.errorHandler(err);
      }).finally( () => {
        this.set('savingMxRecords', false);
      });
    },

    setEditingRecord: function (id) {
      this.set('editingRecord', id);
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

    deleteRecord: function (record) {
      record.destroyRecord({
        adapterOptions: {
          domainId: this.get('model.id')
        }
      }).then(function() {
        App.NotificationsManager.show(record.get('recordType') + ' record has been deleted.', 'notice');
      });
    },

    closeNewDomainAlert: function () {
      this.set('isNewDomain', false);
    }
  }
});
