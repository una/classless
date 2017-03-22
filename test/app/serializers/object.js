import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
	primaryKey: 'key',

	normalizeArrayResponse (store, primaryModelClass, payload){
		payload.meta.dirs.forEach((dir) => {
			payload.objects.push({
				key: dir,
				is_dir: true
			});
		});

		return this._super(...arguments);
	}

});
