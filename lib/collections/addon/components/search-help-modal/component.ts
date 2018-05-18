import { action } from '@ember-decorators/object';
import Component from '@ember/component';
import defaultTo from 'ember-osf-web/utils/default-to';
import layout from './template';

/**
 * Modal that provides examples and explanation of Lucene Search syntax
 *
 * ```handlebars
 * {{search-help-modal
 *      isOpen=isOpen
 * }}
 * ```
 * @class search-help-modal
 */
export default class SearchHelpModal extends Component.extend({
    init(...args: any[]) {
        this._super(...args);
        // TODO: this doesn't make sense in the init. Sould be didInsertElement or something
        // this.set('currentPath', `${window.location.origin}${window.location.pathname}`);
    },
}) {
    layout = layout;

    currentPath!: string;
    isOpen: boolean = defaultTo(this.isOpen, false);

    @action
    toggleHelpModal() {
        this.toggleProperty('isOpen');
    }
}
