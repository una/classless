import Ember from 'ember';
import App from '../../../app';
import BaseController from '../../base';
import allMimeTypes from '../../../utils/all-mime-types';
import { objectStorageFetch } from '../../../utils/apiHelpers';
import { DEBOUNCE_AMOUNT, LETTER_KEY_A, ESC_KEY } from '../../../constants';
import _ from 'lodash';

const MIME_TYPES = allMimeTypes();

const INFINTE_SCROLL_THRESHOLD = 400;
const TABLE_BORDER_WIDTH = 2;

export default BaseController.extend({
  queryParams: ['sort', 'sort_direction', 'path'],
  sort: 'last_modified',
  sort_direction: 'desc',
  path: '',

  uploading: Ember.A(),

  menuItems: [{
    name: 'Quick Share',
    disableDir: true,
    disableMulti: true
  }, {
    name: 'Download',
    disableDir: true,
    disableMulti: true
  }, {
    name: 'Manage Metadata',
    disableDir: true,
    disableMulti: true
  }, {
    name: 'Manage Permissions',
    disableDir: true,
    disableMulti: true
  }, {
    name: 'Rename',
    disableMulti: true
  }, {
    name: 'Move',
    disableDir: true,
    disableMulti: true
  }, {
    name: 'Delete'
  }],

  quickShareOptions: [{
    hours: 1, // eslint-disable-line no-magic-numbers
    copy: '1 hour'
  }, {
    hours: 6, // eslint-disable-line no-magic-numbers
    copy: '6 hours'
  }, {
    hours: 24, // eslint-disable-line no-magic-numbers
    copy: '1 day'
  }, {
    hours: 3 * 24, // eslint-disable-line no-magic-numbers
    copy: '3 days'
  }, {
    hours: 7 * 24, // eslint-disable-line no-magic-numbers
    copy: '7 days'
  }],

  BREADCRUMB_PATH: '__breadcrumb__',

  spaceController: Ember.inject.controller('spaces.show'),
  bucketName: Ember.computed.alias('spaceController.bucket.name'),

  filteredObjects: function () {
    let newFiles = this.get('newFiles');
    let newEmptyDirs = this.get('newEmptyDirs');
    let newDirs = this.get('newDirs');
    let path = this.get('currentDir');
    let loadingPath = this.get('loadingPath');
    let selectedItems = this.get('selectedItems');

    return newEmptyDirs.concat(newFiles).concat(newDirs).concat(this.get('model').toArray().filter(function (file) {
      return file.get('key') !== path;
    })).map((obj) => {
      if(obj.get('isDir')) {
        obj.setProperties({
          name: obj.get('name') ? obj.get('name') : obj.get('key').slice(0, -1).split('/').pop(),
          newFile: newDirs.indexOf(obj) > -1 || newEmptyDirs.indexOf(obj) > -1
        });
      } else {
        obj.setProperties({
          name: obj.get('name') ? obj.get('name') : obj.get('key').replace(/(.*\/)?(.*)/, '$2'),
          newFile: newFiles.indexOf(obj) > -1
        });
      }
      obj.setProperties({
        loadingDir: loadingPath === obj.get('name'),
        isSelected: selectedItems.indexOf(obj.get('key')) > -1
      });
      return obj;
    }).sort((a, b) => {
      let aIsNew = a.get('newFile');
      let bIsNew = b.get('newFile');
      if(aIsNew !== bIsNew) {
        return aIsNew ? -1 : 1;
      } else if (aIsNew && bIsNew) {
        return b.get('lastModified').getTime() - a.get('lastModified').getTime();
      }
      return a.get('key').localeCompare(b.get('key'));
    });
  }.property('model', 'model.meta', 'model.[]', 'selectedItems.[]', 'newFiles.[]', 'newDirs.[]', 'newEmptyDirs.[]', 'loadingPath', 'renamingObj.key'),

  filteredMimeTypes: function () {
    let matches = {};
    let innerMatches = {};
    let search = (this.get('mimeSearch') || '').toLowerCase().trim();

    return MIME_TYPES.filter(function (type) {
      let index = type.indexOf(search);
      if(index > -1) {
        matches[type] = index;
        let subType = type.substr(type.indexOf('/') + 1);
        index = subType.indexOf(search);
        if(index > -1) {
          innerMatches[type] = index;
        }
        return true;
      }
    }).sort(function (a, b) {
      let maxLen = Math.max(a.length, b.length),
          aIndex = matches[a],
          bIndex = matches[b],
          aIindex = !_.isUndefined(innerMatches[a]) ? innerMatches[a] : maxLen,
          bIindex = !_.isUndefined(innerMatches[b]) ? innerMatches[b]: maxLen,
          useInnerCompare = (aIndex && bIndex) || !aIindex || !bIindex;
      if(useInnerCompare && (aIindex - bIindex)) {
        return aIindex - bIindex;
      }
      if(aIndex - bIndex) {
        return aIndex - bIndex;
      }
      return a.localeCompare(b);
    }).map(function (name) {
      return Ember.Object.create({
        type: 'default',
        name: name
      });
    });
  }.property('mimeSearch'),

  multiSelectMenuItems: function () {
    let selectedItems = this.get('selectedItems');
    if(selectedItems.length === 1 && this.findObjectByKey(selectedItems[0]).get('isDir')) {
      return this.get('directoryMenuItems');
    }

    let hasMultiple = this.get('hasMultipleSelections');
    return this.get('menuItems').toArray().filter(function (item) {
      return !hasMultiple || !item.disableMulti;
    });
  }.property('menuItems', 'hasMultipleSelections'),

  directoryMenuItems: function () {
    return this.get('menuItems').toArray().filter(function (item) {
      return !item.disableDir;
    });
  }.property('menuItems'),

  pathArray: function () {
    return this.get('path') ? this.get('path').split('/').slice(0, -1) : [];
  }.property('path'),

  currentDir: function () {
    return this.get('path').replace(/^(.*\/)(.*)/, '$1');
  }.property('path'),

  hasMultipleSelections: function () {
    return this.get('selectedItems.length') > 1;
  }.property('selectedItems.length'),

  selectedCount: function () {
    return this.get('selectedItems.length');
  }.property('selectedItems.length'),

  totalFilesCount: function () {
    return this.get('filteredObjects.length');
  }.property('filteredObjects'),

  metadataContentType: function () {
    return this.get('metadata.contentType');
  }.property('metadata'),

  doneInfiniteScroll: function () {
    this.set('isDoingInfiniteScroll', false);
  }.observes('model'),

  filterConflicts: function (keys) {
    let path = this.get('currentDir');
    return keys.filter(key => key.slice(-1) !== '/').map(key => key.indexOf(path) ? key : key.replace(path, ''));
  },

  setupInfiniteScroll: function () {
    let $container = Ember.$('.file-browser');
    let $table = $container.find('.table-files');
    let $tableHeaders = $table.find('.aurora-th');
    let $actionHeader = $container.find('.action-header');
    let $stickyHeader = $container.find('.sticky-header');

    let theadHeight = $tableHeaders.eq(0).outerHeight(true);
    let actionHeight = $actionHeader[0].offsetHeight;
    let lastScrollPos = window.pageYOffset;
    let wasSticky = false;

    this.stickyPos = $actionHeader.offset().top;

    $actionHeader.css({
      width: $actionHeader[0].offsetWidth,
      height: actionHeight
    });

    let handleSticky = (scrollPos) => {
      let isSticky = scrollPos >= (wasSticky ? this.stickyPos : (this.stickyPos = $actionHeader.offset().top));
      if(wasSticky !== isSticky) {
        $container.css('paddingBottom', isSticky ? actionHeight : '');
        $actionHeader.toggleClass('sticky');
        $stickyHeader.toggleClass('sticky').css('transform', isSticky ? 'translate3d(0,' + actionHeight + 'px, 0)' : '');
        $table.toggleClass('sticky').css('transform', isSticky ? 'translate3d(0,' + (actionHeight - (TABLE_BORDER_WIDTH * 2)) + 'px, 0)' : ''); // eslint-disable-line no-magic-numbers
      }
      wasSticky = isSticky;
    };

    $stickyHeader.css({
      height: theadHeight + TABLE_BORDER_WIDTH,
      lineHeight: theadHeight - (TABLE_BORDER_WIDTH) + 'px'
    }).find('.aurora-th').each(function (i, th) {
      th.style.width = $tableHeaders.eq(i).width() + 'px';
    });

    handleSticky(lastScrollPos);

    let getMoreFiles = () => {
      this.set('isDoingInfiniteScroll', true);
      window.setTimeout(this.send.bind(this, 'getMoreFiles', this.get('model.meta.marker')), 0);
    };

    Ember.$(window).on('scroll.fileBrowser', () => {
      let scrollPos = window.pageYOffset;
      handleSticky(scrollPos);

      if((scrollPos > lastScrollPos) && this.get('model.meta.marker') && !this.get('sorting') && !this.get('loadingPath') && !this.get('isDoingInfiniteScroll')) {
        if((scrollPos + document.body.offsetHeight) > ($table.offset().top + $table[0].offsetHeight - INFINTE_SCROLL_THRESHOLD)) {
          Ember.run(getMoreFiles);
        }
      }
      lastScrollPos = scrollPos;
    });
  },

  teardownInfiniteScroll: function () {
    Ember.$('window').off('scroll.fileBrowser');
  },

  selectKeyListener: function (e) {
    if(Ember.$('input:focus, textarea:focus, .Modal').length) {
      return;
    }

    if((e.ctrlKey || e.metaKey) && e.which === LETTER_KEY_A) {
      this.selectAllFiles();
    } else if (e.which === ESC_KEY && !(e.ctrlKey || e.metaKey)) {
      this.clearAllSelections();
    }
  },

  setupKeyListener: function () {
    this.keyListener = this.selectKeyListener.bind(this);
    document.addEventListener('keydown', this.keyListener);
  },

  teardownKeyListener: function () {
    document.removeEventListener('keydown', this.keyListener);
  },

  disableUserSelectMomentarily: function () {
    let $body = Ember.$('body').css('userSelect', 'none');
    Ember.run.later(function () {
      $body.css('userSelect', '');
    }, 100); // eslint-disable-line no-magic-numbers
  },

  addSelection: function (item, listIndex) {
    if(item.get('isRenaming')){
      return;
    }

    let key = item.get('key');
    let index = this.get('selectedItems').indexOf(key);
    if (index > -1) {
      this.get('selectedItems').removeAt(index, 1);
    } else {
      this.set('lastSelected', listIndex);
      this.get('selectedItems').pushObject(key);
    }
  },

  setSelection: function (item, index) {
    let selectedItems = this.get('selectedItems');
    if(selectedItems.indexOf(item.get('key')) === -1 || selectedItems.length > 1) {
      this.set('selectedItems', Ember.A());
      this.addSelection(item, index);
    } else {
      this.set('selectedItems', Ember.A());
    }
  },

  batchSelect: function (index) {
    let count = Math.abs(index - this.get('lastSelected'));
    let start = Math.min(index, this.get('lastSelected') + 1);
    this.get('selectedItems').pushObjects(this.get('filteredObjects').slice(start, start + count).map(function (obj) {
      return obj.get('key');
    }).filter((name) => {
      return this.get('selectedItems').indexOf(name) === -1;
    }));
  },

  selectAllFiles: function () {
    this.disableUserSelectMomentarily();
    this.set('selectedItems', this.get('filteredObjects').map(function (obj) {
      return obj.get('key');
    }));
  },

  clearAllSelections: function () {
    this.set('selectedItems', Ember.A());
  },

  updateQueryPath: function (path) {
    this.set('loadingPath', this.BREADCRUMB_PATH);
    this.transitionToRoute({ queryParams: { path: path }});
  },

  getDownloadUrl: function (obj ,time) {
    return obj.generateDownloadUrl(this.get('bucketName'), time);
  },

  generateQuickShareUrl: function (time) {
    this.setProperties({
      quickShareUrl: '',
      selectedQuickShareTab: time
    });
    this.getDownloadUrl(this.get('quickShare'), time).then((downloadUrl) => {
      this.set('quickShareUrl', downloadUrl);
    });
  },

  findObjectByKey: function (key, lookup = 'key') {
    let objs = this.get('filteredObjects');
    let len = objs.length;
    while(len--) {
      if(key === objs[len].get(lookup)) {
        return objs[len];
      }
    }
  },

  removeObject: function (object) {
    let arrs = ['newEmptyDirs', 'newDirs', 'newFiles', 'model'];
    let len = arrs.length;
    while(len--) {
      let arr = this.get(arrs[len]);
      if(arr.indexOf(object) > -1) {
        return arr.removeObject(object);
      }
    }
  },

  removeObjectByKey: function (key) {
    let clobbered = this.findObjectByKey(key);
    if(clobbered) {
      this.removeObject(clobbered);
      return clobbered;
    }
  },

  isSearching: function () {
    return this.get('typing') || this.get('searching');
  }.property('typing', 'searching'),

  doSearch: function () {
    this.setProperties({
      searching: true,
      typing: false
    });

    this.updateQueryPath(this.get('rootPath') + this.get('searchQuery'));
  },

  setRootPathFromSearchQuery: function () {
    let qry = this.get('searchQuery').split('/');
    if(qry.length <= 1) {
      return;
    }
    let search = qry.pop();
    let rootPath = this.get('rootPath') ? this.get('rootPath') : '';
    qry = qry.join('/') + '/';
    let newRoot = rootPath + qry;
    this.set('rootPath', newRoot);
    this.transitionToRoute({ queryParams: { path:  newRoot + search }});

    this.set('searchQuery', search);
  },

  doUpload: function (files, acl) {
    let path = this.get('currentDir');

    this.setProperties({
      hideUploading: false,
      uploadCollapsed: false
    });

    let uploads = [];
    let count = 0;
    Array.prototype.forEach.call(files, (file) => {
      let uploadFile = file.get('file');

      let object = this.store.createRecord('object', {
        key: path + file.get('fullPath'),
        size: uploadFile.size,
        lastModified: new Date()
      });
      let uploadObj = Ember.Object.create({ name: uploadFile.name });
      let options = { 'x-amz-acl': acl };
      this.get('uploading').unshiftObject(uploadObj);
      object.generateUploadUrl(this.get('bucketName'), uploadFile.type, options).then((resp) => {
        uploads.push({
          object,
          resp,
          uploadObj,
          uploadFile
        });
        if(++count !== files.length) {
          return;
        }
        let upload = () => {
          uploads.forEach((args) => {
            let { object, resp, uploadObj, uploadFile } = args;
            return object.uploadFile(resp.upload_url, resp.content_type, uploadFile.isEmptyDir ? null : uploadFile, options).then(() => {
              let curPath = this.get('currentDir');
              let clobbered;
              if((object.get('key').indexOf(curPath)) === 0 && (curPath.split('/').length >= path.split('/').length)) {
                let key = object.get('key');
                let relPath = key.replace(curPath, '');

                if(relPath.indexOf('/') === -1) {
                  clobbered = this.removeObjectByKey(key);
                  this.get('newFiles').pushObject(object);
                } else  {
                  let dir = relPath.match(/^([^\/]*\/).*$/)[1].slice(0, -1);
                  key = curPath + dir + '/';

                  let newDir = this.store.createRecord('object', {
                    key: key,
                    size: 0,
                    lastModified: new Date(),
                    isDir: true
                  });
                  clobbered = this.removeObjectByKey(key);
                  this.get('newDirs').pushObject(newDir);
                }
              }
              if(clobbered) {
                this.decrementProperty('spaceController.model.numBytes', clobbered.get('size'));
              } else {
                this.incrementProperty('spaceController.model.numObjects', 1);
              }
              this.incrementProperty('spaceController.model.numBytes', object.get('size'));

              uploadObj.set('success', true);
            }).catch(() => {
              App.NotificationsManager.show('Upload of ' + uploadObj.name + ' failed.', 'alert');
              this.store.unloadRecord(object);
              uploadObj.set('failure', true);
            });
          });
        };
        let conflicts = this.filterConflicts(uploads.filter(args => args.resp.exists).map(args => args.object.get('key')));
        if(!conflicts.length) {
          return upload();
        }
        this.setProperties({
          conflicts: conflicts,
          afterConflict: upload,
          afterConflictCancel: () => {
            this.get('uploading').removeObjects(uploads.map(args => args.uploadObj));
          }
        });
      });
    });
  },

  scrollToTopOfTable: function () {
    if(window.pageYOffset > this.stickyPos) {
      window.scrollTo(0, this.stickyPos);
    }
  },

  createDirectoryName: function (count) {
    let name = 'untitled-' + count;
    let dupe = this.findObjectByKey(name, 'name');
    if(dupe){
      return this.createDirectoryName(count + 1);
    }
    return name;
  },

  updateObjectName: function(obj) {
    obj.set('isRenaming', false);
    if(obj.get('name') === obj.get('origContext')) {
      return;
    }

    let type = 'file';
    let success = (resp) => {
      this.removeObjectByKey(resp.key);
      obj.setProperties({
        key: resp.key,
        lastModified: new Date()
      });
      App.NotificationsManager.show('Your ' + type + ' has been renamed.', 'notice');

    };
    let failure = function () {
      App.NotificationsManager.show('Sorry, your ' + type + ' could not be renamed.', 'alert');
      obj.set('name', obj.get('origContext'));
    };
    let after = function () {
      obj.set('isSavingFile', false);
    };

    obj.set('isSavingFile', true);

    if(obj.get('isDir')) {
      type = 'directory';
      this.renameDirectory(obj, true).then((dryResp) => {
        let rename = () => {
          this.renameDirectory(obj, false).then(success).catch(failure).finally(after);
        };
        let conflicts = this.filterConflicts(dryResp.resp.existing)
        if(!conflicts.length) {
          return rename();
        }
        this.setProperties({
          conflicts: conflicts,
          afterConflict: rename
        });
      })
    } else {
      let key = this.get('currentDir') + obj.get('name');
      obj.getMetaData(this.get('bucketName'), key).then((exists) => {
        let rename = () => {
          obj.moveObject(this.get('bucketName'), key).then(success).catch(failure).finally(after);
        };

        if(!exists) {
          return rename();
        }
        this.setProperties({
          conflicts: this.filterConflicts([key]),
          afterConflict: rename
        });
      });
    }
    this.set('afterConflictCancel', function () {
      obj.setProperties({
        name: obj.get('origContext'),
        isSavingFile: false
      });
    })
  },

  renameDirectory: function(obj, dryRun=false) {
    let replace = this.get('currentDir') + obj.get('name') + '/';
    return this.moveObjects([obj.get('key')], replace, dryRun);
  },

  moveObjects: function(keys, replace, dryRun=false) {
    let data = JSON.stringify({
      "dry_run": dryRun,
      "prefixes": keys,
      "replace": replace
    });

    return objectStorageFetch(`/buckets/${this.get('bucketName')}/objects/move`, 'POST', {}, {body: data}).then((resp) => {
      return {resp: resp, key:replace};
    });
  },

  submitMoveObject: function(key) {
    let obj = this.get('movingObjs.firstObject');
    let oldKey = obj.get('key');
    let newKey = key + obj.get('name');
    obj.set('isMovingFile', true);
    obj.moveObject(this.get('bucketName'), newKey).then(() => {
      this.removeObjectByKey(oldKey);
      App.NotificationsManager.show('Your file has been moved.', 'notice');
    }).catch(() => {
      App.NotificationsManager.show('Sorry your file could not be moved.', 'alert');
    }).finally(() => {
      obj.set('isMovingFile', false);
    });
  },

  createDirectory: function () {
    let path = this.get('currentDir');
    let name = this.createDirectoryName(1);
    let newDir = this.store.createRecord('object', {
      key: path + name + '/',
      size: 0,
      lastModified: new Date(),
      isDir: true,
      isRenaming: true,
      isCreating: true
    });
    this.set('renamingObj', newDir);
    this.get('newEmptyDirs').pushObject(newDir);
    this.scrollToTopOfTable();
  },

  removeEmptyDir: function (newEmptyDir) {
    this.get('newEmptyDirs').removeObject(newEmptyDir);
    this.store.unloadRecord(newEmptyDir);
  },

  saveNewDirectory: function (dir) {
    let headers = { 'x-amz-acl': 'private' };
    let key = this.get('currentDir') + dir.get('name') + '/';
    let clobbered = this.findObjectByKey(key);

    dir.setProperties({
      key: key,
      isSavingFile: true,
      isRenaming: false
    });

    dir.generateUploadUrl(this.get('bucketName'), 'application/json', headers).then((resp) => {
      return dir.uploadFile(resp.upload_url, resp.content_type, null, headers).then(() => {
        App.NotificationsManager.show('Your directory has been created.', 'notice');
        if(clobbered && clobbered !== dir) {
          this.removeObject(clobbered);
        }
      });
    }).catch(() => {
      App.NotificationsManager.show('Sorry, that directory could not be saved.', 'alert');
      this.removeEmptyDir(dir);
    }).finally(function () {
      dir.setProperties({
        isSavingFile: false,
        isCreating: false
      });
    });
  },

  updateMimeSearch: function (val = '') {
    this.setProperties({
      mimeSearch: val,
      isValidMime: !val || !!val.match(/^[^\/]+\/[^\/]+$/)
    });
  },

  validateMetaData: function () {
    let keys = {};
    this.set('metaDataIsValid', this.get('metadata.customMetadata').reduce(function (isValid, item) {
      if(keys[item.key]) {
        return false;
      }
      keys[item.key] = true;
      return isValid && item.key.match(/^x-amz-meta-[a-z\-_1-9]+$/);
    }, true));
  },

  submitEdit: function (obj, origContext) {
    if(obj.get('isDir') && obj.get('isCreating')) {
      this.saveNewDirectory(obj);
    } else {
      this.updateObjectName(obj, origContext);
    }
  },

  actions: {
    menuItemClick: function (item, file) {
      //files that come from selectedItems are strings
      if(typeof file === 'string') {
        file = this.findObjectByKey(file);
      }
      if (item === 'Quick Share') {
        this.set('quickShare', file);
        this.generateQuickShareUrl(1);
      } else if (item === 'Rename') {
        file.setProperties({
          isRenaming: true,
          origContext: file.get('name')
        });
        this.set('renamingObj', file);
      } else if (item === 'Move') {
        this.set('movingObjs', [file]);
      } else if(item === 'Manage Metadata' || item === 'Manage Permissions') {
        let menuItem = this.menuItems.filter(m => m.name === item)[0];
        let isMeta = item === 'Manage Metadata';
        Ember.set(menuItem, 'isLoading', true);
        file.getMetaData(this.get('bucketName')).then((metadata) => {
          if(isMeta) {
            this.updateMimeSearch();
            metadata.file = file;
            this.set('metadata', metadata);
            this.validateMetaData();
          } else {
            this.set('permissions', metadata.acl);
          }
          file.set('metadata', metadata);
        }).catch(function () {
          App.NotificationsManager.show('Sorry, cannot load ' + (isMeta ? 'metadata' : 'permissions') + '.', 'alert');
        }).finally(function () {
          Ember.set(menuItem, 'isLoading', false);
        });
      } else if (item === 'Download') {
        file.set('isDownloading', true);
        this.getDownloadUrl(file).then((url) => {
          let $a = Ember.$(`<a href="${url}" download></a>`).appendTo('body');
          $a[0].click();
          $a.remove();
        }).catch(function () {
          App.NotificationsManager.show('Sorry, cannot download file.', 'alert');
        }).finally(function () {
          file.set('isDownloading', false);
        });
      }
    },

    updateUrl: function (hours) {
      this.generateQuickShareUrl(hours);
    },

    openFileBrowser: function () {
      this.set('fileBrowser', true);
    },

    hideFileBrowser: function (files, acl) {
      this.set('fileBrowser', false);
      if(files) {
        this.doUpload(files, acl === 'private' ? 'private' : 'public-read');
      }
    },

    search: function() {
      this.set('typing', true);
      Ember.run.debounce(this, this.doSearch, DEBOUNCE_AMOUNT);
    },

    searchEnter: function() {
      this.setRootPathFromSearchQuery();
    },

    multiSelectmenuItemClick: function () {

    },

    openDir: function (name) {
      if(this.get('loadingPath')){
        return;
      }

      let path = this.get('currentDir') + name + '/';
      this.setProperties({
        searchQuery: '',
        loadingPath: name,
        rootPath: path
      });
      this.transitionToRoute({ queryParams: { path: path }});
    },

    openRootPath: function () {
      this.updateQueryPath('');
      this.setProperties({
        searchQuery: '',
        rootPath: ''
      });
    },

    goToPath: function (item, index) {
      if(this.get('loadingPath')){
        return;
      }

      let path = this.get('path').split('/').slice(0, index + 1).join('/') + '/';
      this.setProperties({
        searchQuery: '',
        rootPath: path
      });
      this.updateQueryPath(path);
    },

    deleteItem: function (file) {
      file.set('isDeletingFile', true);
      file.deleteFromBucket(this.get('bucketName')).then(() => {
        if(!file.get('isDir')) {
          this.decrementProperty('spaceController.model.numBytes', file.get('size'));
          this.decrementProperty('spaceController.model.numObjects', 1);
        }
        this.removeObject(file);
        App.NotificationsManager.show((file.get('isDir') ? 'Directory' : 'File') +  ' has been deleted.', 'notice');
      }).catch(function () {
        App.NotificationsManager.show('Sorry, your ' + (file.get('isDir') ? 'directory' : 'file') +  ' could not be deleted.', 'alert');
      }).finally(function () {
        file.set('isDeletingFile', false);
      });
    },

    deleteSelectedItems: function () {

    },

    onLoad: function (model) {
      this.setProperties({
        model: model,
        selectedItems: Ember.A(),
        newFiles: Ember.A(),
        newDirs: Ember.A(),
        newEmptyDirs: Ember.A(),
        conflicts: [],
        lastSelected: 0,
        sorting: false,
        loadingPath: false,
        searching: false
      });
      this.scrollToTopOfTable();
    },

    onSetup: function (path, query) {
      Ember.run.scheduleOnce('afterRender', this, this.setupInfiniteScroll);
      Ember.run.scheduleOnce('afterRender', this, this.setupKeyListener);

      this.setProperties({
        rootPath: path,
        uploadCollapsed: false,
        hideUploading: false,
        searchQuery: query
      });
    },

    onTeardown: function () {
      this.set('path', '');
      this.teardownInfiniteScroll();
      this.teardownKeyListener();
    },

    onQuickShareModalHide: function () {
      this.set('quickShare', null);
    },

    onMetadataModalHide: function (save) {
      if(save) {
        let metadata = this.get('metadata');
        let file = metadata.file;
        delete metadata.file;

        file.set('isSavingMeta', true);
        file.saveMetaData(this.get('bucketName'), metadata).then(function () {
          file.set('metadata', metadata);
          App.NotificationsManager.show('Metadata has been updated.', 'notice');
        }).catch(function () {
          App.NotificationsManager.show('Sorry, your metadata could not be updated.', 'alert');
        }).finally(function () {
          file.set('isSavingMeta', false);
        });
      }
      this.set('metadata', null);
    },

    onConfirmConflictModalHide: function (save) {
      this.get(save ? 'afterConflict' : 'afterConflictCancel')();
      this.set('conflicts', []);
    },

    onCloseMoveFiles: function(key, save) {
      if(save) {
        this.submitMoveObject(key);
      }
      this.set('movingObjs', null);
    },

    selectItem: function (e, item, index) {
      if(item.get('isRenaming') || item.get('isSavingFile')) {
        return;
      }
      this.disableUserSelectMomentarily();
      if (e.metaKey || e.ctrlKey){
        this.addSelection(item, index);
      } else if(e.shiftKey) {
        this.batchSelect(index);
      } else {
        this.setSelection(item, index);
      }
    },

    collapseUploading: function () {
      this.set('uploadCollapsed', !this.get('uploadCollapsed'));
    },

    closeUploading: function () {
      this.get('uploading').removeObjects(this.get('uploading').filter(function (obj) {
        return obj.get('success') || obj.get('failure');
      }));
      this.set('hideUploading', true);
    },

    submitEdit: function (name, origContext, obj) {
      this.submitEdit(obj, origContext);
    },

    cancelEdit: function (item, e, nameBeforeCancel) {
      if(item.get('isCreating')) {
        if(e.keyCode === ESC_KEY) {
          this.removeEmptyDir(item);
        } else {
          item.set('name', nameBeforeCancel); //click away resets the name by default
          this.submitEdit(item);
        }
      } else {
        item.set('isRenaming', false);
      }
    },

    createDir: function () {
      this.createDirectory();
    },

    onMimeInput: function (input) {
      this.set('metadata.contentType', input);
      this.updateMimeSearch(input);
    },

    clearMimeTypes: function () {
      Ember.$('.Modal .metadata .aurora-auto-complete').trigger('resetForm');
    },

    clearMeta: function (key) {
      this.set('metadata.' + key, '');
    },

    addCustomPairing: function () {
      this.get('metadata.customMetadata').pushObject({
        key: 'x-amz-meta-',
        value: ''
      });
      this.validateMetaData();
      Ember.run.next(function () {
        Ember.$('.Modal .metadata tr.custom-pairing').prev().find('input')[0].focus();
      });
    },

    removeCustomMeta: function (item) {
      this.get('metadata.customMetadata').removeObject(item);
      this.validateMetaData();
    },

    onCustomMetaChange: function () {
      this.validateMetaData();
    },

    updatePermissions: function (file, acl) {
      file.set('isSavingAcl', true);
      file.saveMetaData(this.get('bucketName'), { acl: acl }).then(function () {
        file.set('metadata.acl', acl);
        App.NotificationsManager.show('Permissions have been updated.', 'notice');
      }).catch(function () {
        App.NotificationsManager.show('Sorry, your permissions could not be updated.', 'alert');
      }).finally(function () {
        file.set('isSavingAcl', false);
      });
    },

    getMetaData: function (file) {
      file.getMetaData(this.get('bucketName')).then((metadata) => {
        file.set('metadata', metadata);
      });
    }
  }
});
