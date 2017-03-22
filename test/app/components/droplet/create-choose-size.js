import Ember from 'ember';
import _ from 'lodash/lodash';
import { PropTypes } from 'ember-prop-types';

export default Ember.Component.extend({

	propTypes: {
		sizesProps: PropTypes.object.isRequired,
		onSelectSize: PropTypes.string,
		onSetSelectedSize: PropTypes.string,
		changeSizesTab: PropTypes.string
	},

	sizesByCat: Ember.computed.sort('sizesProps.model.sizes', (a, b) => a.size_category.id - b.size_category.id),
	sizeCategories: Ember.computed.mapBy('sizesByCat', 'size_category.name'),
	sizeCategoriesUniq: Ember.computed.uniq('sizeCategories'),

	/**
	 * filteredSizes transform model.sizes
	 * @return {array} returns transformed filtered array
	 */
	filteredSizes: function() {
		if(this.get('sizesProps.dropletLimitReached')) {
			return [];
		}

		let sizes = this.get('sizesProps.model.sizes'),
				size = this.get('sizesProps.sizeObj'),
				imageDisk = this.get('sizesProps.image.disk'),
				available,
				error,
				isDiskTooSmall,
				found;

		sizes.forEach((size) => {
			isDiskTooSmall = false;
			available = !!!size.restriction; // eslint-disable-line no-extra-boolean-cast
			error = size.restriction;

			if(imageDisk > size.disk) {
				isDiskTooSmall = true;
			}

			// size is available, but disk is too small for selected image
			if(available && isDiskTooSmall) {
				available = false;
				error = "This size doesn't have enough disk space to support the image you selected.";
			}

			Ember.setProperties(size, {
				available: available,
				error: error,
				isCurrent: false
			});
		});

		// we selected a size from the UI
		if(size) {
			found = size;
		}

		// check deeplink for size
		if(!found && this.get('sizesProps.model.query_state.size.id')) {
			found = _.find(sizes, {available: true, restriction: null, id: this.get('sizesProps.model.query_state.size.id')});
		}

		// if we don't have a deeplinked size, use the size_id in the initial state from the API
		if(!found) {
			found = _.find(sizes, {available: true, restriction: null, id: this.get('sizesProps.model.initial_state.size_id')});
		}

		// we have a size, but it is too small for the selected image's disk
		// let's find the next available size that will fit the image's disk requirement
		if(!found || (found && imageDisk > found.disk)) {
			found = null;
			sizes.forEach((size) => {
				if(!found && !size.restriction && size.disk >= imageDisk) {
					found = size;
				}
			});
		}

		if(found) {
			Ember.set(found, 'isCurrent', true);
		}

		let select = found ? found : null;

		if(this.get('onSetSelectedSize')) {
			this.sendAction('onSetSelectedSize', select);
		}

		return sizes.filterBy('size_category.name', this.get('sizesProps.sizesTab'));

	}.property('sizesProps.model.sizes', 'sizesProps.sizesTab', 'sizesProps.image', 'sizesProps.sizeObj'),

	actions: {

		onSelectSize: function(sizeObj) {
			if(this.get('onSelectSize')) {
				this.sendAction('onSelectSize', sizeObj);
			}
		},

		changeSizesTab: function(tab) {
			if(this.get('changeSizesTab')) {
				this.sendAction('changeSizesTab', tab);
			}
		}

	}
});
