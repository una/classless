import Droplet from '../models/droplet';
import Domain from '../models/domain';
import Kernel from '../models/kernel';
import FloatingIp from '../models/floating-ip';
import Volume from '../models/volume';
import AuroraImage from '../models/image';
import Region from '../models/region';
import VolumeSnapshot from '../models/volume-snapshot';
import Threshold from '../models/threshold';
import Bucket from '../models/bucket';
import LoadBalancer from '../models/load-balancer';
import Firewall from '../models/security-group';
import Tag from '../models/tag';
import Obj from '../models/object';

export default {
  isDroplet: function (item) {
    return item instanceof Droplet;
  },
  isKernel: function (item) {
    return item instanceof Kernel;
  },
  isDomain: function (item) {
    return item instanceof Domain;
  },
  isFloatingIP: function (item) {
    return item instanceof FloatingIp;
  },
  isVolume: function (item) {
    return item instanceof Volume;
  },
  isVolumeSnapshot: function(item) {
    return item instanceof VolumeSnapshot;
  },
  isThreshold: function (item) {
    return item instanceof Threshold;
  },
  isRegion: function (item) {
    return item instanceof Region;
  },
  isImage: function (item) {
    return item instanceof AuroraImage;
  },
  isLoadBalancer: function (item) {
    return item instanceof LoadBalancer;
  },
  isFirewall: function (item) {
    return item instanceof Firewall;
  },
  isBucket: function (item) {
    return item instanceof Bucket;
  },
  isTag: function (item) {
    return item instanceof Tag;
  },
  isObject: function (item) {
    return item instanceof Obj;
  },
  getTypeStr: function (item) {
    if(this.isKernel(item)) {
      return 'Kernel';
    } else if(this.isVolume(item)) {
      return 'Volume';
    } else if(this.isFloatingIP(item)) {
      return 'Floating IP';
    } else if(this.isDroplet(item)) {
      return 'Droplet';
    } else if(this.isRegion(item)) {
      return 'Region';
    } else if(this.isVolumeSnapshot(item)) {
      return 'Volume Snapshot';
    } else if(this.isThreshold(item)) {
      return 'Threshold';
    } else if(this.isDomain(item)) {
      return 'Domain';
    } else if(this.isBucket(item)) {
      return 'Bucket';
    } else if(this.isTag(item)) {
      return 'Tag';
    }

    return '';
  },
  getPluralizedTypeString: function(item) {
    return this.getTypeStr(item) + 's';
  }
};
