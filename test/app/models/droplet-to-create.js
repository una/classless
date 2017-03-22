import DS from 'ember-data';
import config from '../config/environment';
import {post} from '../utils/apiHelpers';

const apiNS = config['api-namespace'];

export default DS.Model.extend({
  name: DS.attr(),
  names: DS.attr(),
  sizeId: DS.attr('number'),
  regionId: DS.attr(),
  imageId: DS.attr(),
  userData: DS.attr(),
  sshKeys: DS.attr(),
  sshKeyIds: DS.attr(),
  volumes: DS.attr(),
  tags: DS.attr(),

  save: function (options) {
    let droplet = this.serialize();
    if(options) {
      options.forEach(function (option) {
        droplet[option] = true;
      });
    }
    return post(`/${apiNS}/droplets`, {
      droplet: droplet
    });
  }
});
