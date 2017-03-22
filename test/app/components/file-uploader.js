import Ember from 'ember';

const ROOT_FILE_REGEX = /^[^\/]*$/;
const FIRST_DIR_REGEX = /^([^\/]*)\/.*$/;

export default Ember.Component.extend({
  classNames: ['file-uploader'],
  files: Ember.A(),

  myId: function () {
    return 'uploader-' + Ember.guidFor(this);
  }.property(),

  filteredFiles: function () {
    let rootFiles = this.get('files').filter(function (file) {
      return file.get('fullPath').match(ROOT_FILE_REGEX);
    }).map(function (file) {
      let f = file.get('file');
      file.setProperties({
        displayName: f.name,
        displaySize: f.size,
        displayType: f.type
      });
      return file;
    });

    let dirFiles = this.get('files').filter(function (file) {
      return !file.get('fullPath').match(ROOT_FILE_REGEX);
    });
    let rootDirs = dirFiles.map(function (file) {
      file.set('displayName', file.get('fullPath').match(FIRST_DIR_REGEX)[1]);
      return file;
    }).filter(function (dir, i, arr) {
      for(; i > 0; i--) {
        if(arr[i - 1].get('displayName') === dir.get('displayName')) {
          return false;
        }
      }
      return true;
    }).map(function (dir) {
      let count = 0;
      let size = 0;
      let name = dir.get('displayName');
      dirFiles.forEach(function (file) {
        if(!file.get('file').isEmptyDir && file.get('fullPath').indexOf(name) === 0) {
          size += file.get('file').size;
          count++;
        }
      });
      if(count) {
        name += ' (' + count + ' file' + (count > 1 ? 's' : '') + ')';
      }
      dir.setProperties({
        displayName: name,
        displayType: 'folder',
        displaySize: size,
        isDir: true
      });
      return dir;
    });

    return rootFiles.concat(rootDirs).sort(function (a, b) {
      return b.get('lastModified').getTime() - a.get('lastModified').getTime();
    });
  }.property('files.[]'),

  getFile: function (entry, path, cb) {
    if(entry.file) {
      entry.file(function(file) {
        cb([Ember.Object.create({
          file: file,
          fullPath: path + file.name,
          lastModified: new Date()
        })]);
      });
    } else {
      window.setTimeout(cb.bind(null, []), 0);
    }
  },

  getDirFiles: function (entry, cb, path = '') {
    let files = [];
    entry.createReader().readEntries((entries) => {
      let processed = 0;
      let after = function (processedFiles) {
        files = files.concat(processedFiles);
        if(++processed === entries.length) {
          cb(files);
        }
      };
      entries.forEach((dirEntry) => {
        if(dirEntry.isFile) {
          this.getFile(dirEntry, path, after);
        } else {
          this.getDirFiles(dirEntry, after, path + dirEntry.name + '/');
        }
      });
      if(!entries.length) {
        files.push(Ember.Object.create({
          file: { name: entry.name, size: 0, isEmptyDir: true },
          lastModified: new Date(),
          fullPath: path
        }));
        cb(files);
      }
    });
  },

  getFilesFromEntry: function (entry, cb) {
    if(entry.isDirectory) {
      this.getDirFiles(entry, cb, entry.name + '/');
    } else {
      this.getFile(entry, '', cb);
    }
  },

  addFiles: function (files) {
    let fileNames = {};
    this.get('files').forEach(function (file) {
      return fileNames[file.get('fullPath')] = file;
    });

    let duplicates = [];
    files.forEach(function (file) {
      let path = file.get('fullPath');
      if(fileNames[path]) {
        duplicates.push(fileNames[path]);
      }
    });

    this.get('files').removeObjects(duplicates).unshiftObjects(files);
  },

  setup: function () {
    let $this = this.$();
    let that = this;

    this.setProperties({
      files: Ember.A(),
      aclRadioValue: 'private'
    });

    $this.find('#' + this.get('myId')).on('change', function () {
      that.addFiles(Array.prototype.slice.call(this.files).map(function (file) {
        return Ember.Object.create({
          fullPath: file.name,
          lastModified: new Date(),
          file: file
        });
      }));
      this.value = '';
    });

    $this.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }).on('dragover dragenter', function() {
      $this.find('.upload-area').addClass('dragover');
      Ember.$('.Modal-backdrop').addClass('dragover');
    }).on('dragleave dragend drop', function() {
      $this.find('.upload-area').removeClass('dragover');
      Ember.$('.Modal-backdrop').removeClass('dragover');
    }).on('drop', (e) => {
      let count = 0;
      let processed = 0;
      let files = [];
      Array.prototype.slice.call(e.originalEvent.dataTransfer.items).forEach((item) => {
        let entry = item.webkitGetAsEntry();
        if(entry) {
          count++;
          this.getFilesFromEntry(entry, (entryFiles) => {
            files = files.concat(entryFiles);
            if(++processed === count) {
              this.addFiles(files);
            }
          });
        }
      });
    });
  }.on('didInsertElement'),

  teardown: function () {
    let $this = this.$();
    $this.find('#' + this.get('myId')).off('change');
    $this.off('drag dragstart dragend dragover dragenter dragleave drop');
  }.on('willDestroyElement'),

  actions: {
    removeFile: function (toRemove) {
      let files = this.get('files');
      if(toRemove.get('fullPath').match(ROOT_FILE_REGEX)) {
        files.removeObject(toRemove);
      } else {
        let removeAtDir = toRemove.get('fullPath').match(FIRST_DIR_REGEX)[1];
        files.removeObjects(files.filter(function (file) {
          return file.get('fullPath').indexOf(removeAtDir) === 0;
        }));
      }
    },
    aclChange: function (val) {
      this.set('aclRadioValue', val);
    },
    hideModal: function (doUpload) {
      this.sendAction('hideAction', doUpload ? this.get('files') : null, this.get('aclRadioValue'));
    }
  }

});
