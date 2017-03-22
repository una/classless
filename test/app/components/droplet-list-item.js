import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  tagName: 'tr',
  menuItemClick: null,
  tagClick: null,

  listItems: {
    'Add a domain': '/networking/domains?domain-dropletIp={{ipAddress}}',
    'Access console': '/droplets/{{id}}/console',
    'Resize droplet': '/droplets/{{id}}#tab-resize',
    'View usage': '/droplets/{{id}}#tab-graphs',
    'Enable backups': '/droplets/{{id}}#tab-backups',
    'Tags': '/droplets/{{id}}#tab-tags',
    'Destroy': '/droplets/{{id}}#tab-destroy'
  },

  filteredListItems: function() {
    let backupsEnabled = this.get('droplet.backupsEnabled');
    let isPoweredOff = this.get('droplet.isPoweredOff');

    let filteredItems = [];

    if (backupsEnabled) {
      filteredItems.push('Enable backups');
    } else if (isPoweredOff) {
      filteredItems.push('Access console');
    }

    return _.map(_.difference(Object.keys(this.listItems), filteredItems), (key) => {
      if (key === 'Tags') {
        return {
          isLoading: this.get('droplet.pendingTagEvent'),
          name: this.get('droplet.tags.length') ? 'Edit tags' : 'Add tags'
        };
      }
      return { name: key };
    });
  }.property('droplet.backupsEnabled', 'droplet.isPoweredOff', 'droplet.tags.length', 'droplet.pendingTagEvent'),

  actions: {
    menuItemClick: function (clickedKey, droplet) {
      let item = this.listItems[clickedKey];
      if (clickedKey === 'Edit tags' || clickedKey === 'Add tags') {
        item = this.listItems['Tags'];
      }

      if(item) {
        this.sendAction('menuItemClick', clickedKey, droplet, item);
      }
    },
    tagClick: function(tag) {
      this.sendAction('tagClick', tag);
    }
  }
});
