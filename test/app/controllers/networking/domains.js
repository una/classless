import BaseController from '../base';
import App from '../../app';
import IndexPage from '../../mixins/controllers/index-page';
import {DEFAULT_TTL} from '../../constants';

export default BaseController.extend(IndexPage, {
  trackPageName: 'Networking Domains',
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'name',
  sort_direction: 'asc',
  page: 1,
  paginating: false,
  customIP: null,
  menuItems: [
    {name: 'Manage domain'},
    {name: 'Download zone'},
    {name: 'Delete'}
  ],
  domainName: '',
  //set up index page mixin
  filteredModelProperty: 'filteredDomains',
  modelProperty: 'model',

  // Properties

  domainsMeta: function() {
    return this.get('model.meta');
  }.property('model'),

  filteredDomains: function() {
    return this.get('model').filter( (model) => {
      return !model.get('isDeleted') || model.get('isSaving');
    });
  }.property('model', 'model.@each.isSaving', 'model.@each.directsTo', 'modal.@each.directsToResource'),

  needsPagination: function () {
    return this.get('domainsMeta').pagination.pages > 1;
  }.property('domainsMeta'),

  doneSorting: function () {
    this.set('sorting', false);
  }.observes('model'),


  // TODO Test CrossBrowser
  downloadZoneFile: function (domain) {
    let filename = domain.get('name') + '-zone.txt';
    let text = domain.get('zoneFile');
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },

  // Actions
  actions: {
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },

    menuItemClick: function(clickedKey, domain) {
      this.trackAction('Menu Item Click: ' + clickedKey);
      if(clickedKey === 'Manage domain') {
        this.transitionToRoute('domain', domain.get('id'));
      } else if(clickedKey === 'Download zone') {
        this.downloadZoneFile(domain);
      }
    },

    onCreateRecord: function() {
      let domain = this.store.createRecord('domain', {
        name: this.get('domainName')
      });

      domain.set('isInitializing', true);

      this.set('isCreatingRecord', true);
      domain.save().then((domain) => {
        let done = () => {
          this.incrementProperty('domainsMeta.domain_count', 1);
          this.set('domainName', '');

          this.transitionToRoute('domain', domain.id, {
            queryParams: {
              newDomain: true
            }
          });
        };

        if(this.get('droplet')) {
          return this.store.createRecord('domainRecord', {
            recordType: 'A',
            name: '@',
            dataRecord: this.get('droplet.ipAddress'),
            ttl: DEFAULT_TTL
          }).save({
            adapterOptions: {
              domainId: domain.get('id')
            }
          }).then(done);
        }
        done();
      }).catch((err) => {
        this.errorHandler(err, 'Creating Domain');
      }).finally(() => {
        this.set('isCreatingRecord', false);
        domain.set('isInitializing', false);
      });
    },

    deleteDomain: function(domain) {
      let name = domain.get('name');

      domain.set('isDeleting', true);
      domain.destroyRecord().then(() => {
        this.decrementProperty('domainsMeta.domain_count', 1);
        App.NotificationsManager.show(name + ' has been deleted.', 'notice');
      }).catch((err) => {
        this.errorHandler(err, 'Deleting Domain');
        domain.set('isDeleting', false);
      });
    },

    removeDroplet: function () {
      this.set('droplet', null);
    }

  }
});
