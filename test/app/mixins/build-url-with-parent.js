import Ember from 'ember';

export default Ember.Mixin.create({
  buildURL: function(type, id, snapshot) {
    let url = [];
    let host = this.get('host');
    let prefix = this.urlPrefix();

    if (!this.parentType) {
      throw new Error("buildURL(): Expected serializer to define parentType");
    }
    let parentPath = this.pathForType(this.parentType);
    let parentRecord = snapshot.belongsTo(this.parentType);

    url.push([parentPath, parentRecord.id].join('/'));
    if (type) { url.push(this.pathForType(type)); }
    if (id && !Ember.isArray(id)) { url.push(encodeURIComponent(id)); }

    if (prefix) { url.unshift(prefix); }
    url = url.join('/');
    if (!host && url) { url = '/' + url; }

    return url;
  }
});
