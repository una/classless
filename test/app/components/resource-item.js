import Ember from 'ember';
import TypesHelper from '../utils/types';

export default Ember.Component.extend({
  tagName: '',

  isDefault: function (item) {
    return item.type === 'default' || item.type === 'static';
  },

  resourceName: function () {
    if(this.get('resourceImage')) {
      return this.get('resourceImage');
    }

    let item = this.get('item');

    if(this.isDefault(item)) {
      return '';
    }

    if(TypesHelper.isDroplet(item) || TypesHelper.isKernel(item)) {
      return 'droplet';
    }

    if(item.get('isSnapshot') || item.get('isBackup') || TypesHelper.isImage(item)) {
      return 'snapshot';
    }

    if(TypesHelper.isVolumeSnapshot(item)) {
      return 'volume-snapshot';
    }

    if(this.get('isVolume')) {
      return 'storage';
    }

    if(this.get('isThreshold')) {
      return 'threshold';
    }

    if(this.get('isBucket')) {
      return 'bucket';
    }

    if(this.get('isDomain')) {
      return 'domain';
    }

    if(this.get('isLoadBalancer')) {
      return 'load-balancer';
    }

    if(this.get('isFirewall')) {
      return 'firewall';
    }

    if(this.get('isFile')) {
      return 'file';
    }

    if(this.get('isFolder')) {
      return 'folder';
    }

    return 'floating-ip';
  }.property('item'),

  resourceType: function () {
    let item = this.get('item');
    if(this.isDefault(item)) {
      return 'default';
    }

    return this.get('resourceName');
  }.property('item'),


  resourceValue: function () {
    let item = this.get('item');
    if(this.isDefault(item)) {
      return item.name;
    }

    if(this.get('showIpMeta')) {
      return item.get('ipAddress');
    }
    return item.get('name');
  }.property('item'),

  ipDescription: function () {
    let item = this.get('item');
    //droplet
    if(TypesHelper.isDroplet(item)) {
      return this.get('showIpv6') ? item.get('publicIpv6') : item.get('ipAddress');
    }
    //floating ip
    if(item.get('droplet.name')) {
      return item.get('droplet.name');
    }

    return 'Floating IP';
  }.property('item'),

  isFloatingIp: function () {
    return TypesHelper.isFloatingIP(this.get('item'));
  }.property('item'),

  isKernel: function() {
    return TypesHelper.isKernel(this.get('item'));
  }.property('item'),

  isBucket: function () {
    return TypesHelper.isBucket(this.get('item'));
  }.property('item'),

  isImage: function () {
    return TypesHelper.isImage(this.get('item'));
  }.property('item'),

  isLoadBalancer: function () {
    return TypesHelper.isLoadBalancer(this.get('item'));
  }.property('item'),

  isFirewall: function () {
    return TypesHelper.isFirewall(this.get('item'));
  }.property('item'),

  isVolume: function () {
    return this.get('item.isVolume') || TypesHelper.isVolume(this.get('item'));
  }.property('item'),

  isVolumeSnapshot: function () {
    return TypesHelper.isVolumeSnapshot(this.get('item'));
  }.property('item'),

  isDomain: function () {
    return TypesHelper.isDomain(this.get('item'));
  }.property('item'),

  isFile: function () {
    return TypesHelper.isObject(this.get('item')) && !this.get('item.isDir');
  }.property('item'),

  isFolder: function () {
    return TypesHelper.isObject(this.get('item')) && this.get('item.isDir');
  }.property('item'),

  isThreshold: function() {
    return TypesHelper.isThreshold(this.get('item'));
  }.property('item'),

  hasMeta: function () {
    return this.get('disabledMeta') || (!this.isDefault(this.get('item')) && !TypesHelper.isRegion(this.get('item')) && !TypesHelper.isObject(this.get('item')));
  }.property('item', 'disabledMeta'),

  hideIconType: function () {
    return this.get('disabledMeta') || (!this.isDefault(this.get('item')) && !TypesHelper.isRegion(this.get('item')));
  }.property('item', 'disabledMeta'),

  resourceItemName: function() {
    if(this.get('expandImageName') && this.get('isImage') && !this.get('item.wasCreatedByUser')) {
      return this.get('item.longName');
    }
    return this.get('item.name');
  }.property('expandImageName', 'isImage', 'item.longName', 'item.name'),

  actions: {
    onClose: function () {
      if(this.get('onClose')) {
        this.sendAction('onClose', this.get('item'));
      }
    },

    onTitleClick: function() {
      if (this.get('onTitleClick')) {
        this.sendAction('onTitleClick');
      }
    }
  }
});
