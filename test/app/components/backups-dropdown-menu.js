import DropdownMenu from '../components/dropdown-menu';

export default DropdownMenu.extend({
  onInit: function () {
    this.classNames = (this.classNames || []).concat(['aurora-backups-dropdown-menu']);
  }.on('init'),

  actions: {
    restore: function() {
      this.clickAway();
      this.sendAction('restoreBackupAction', this.get('imageId'));
    },
    createFrom: function() {
      this.clickAway();
      this.sendAction('createFromBackupAction', this.get('imageId'));
    },
    convertToSnapshot: function() {
      this.clickAway();
      this.sendAction('convertToSnapshotAction', this.get('imageId'));
    }
  }
});