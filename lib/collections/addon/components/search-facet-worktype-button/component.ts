import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import { capitalize } from '@ember/string';
import layout from './template';

/**
 * Copied from Ember-SHARE.  Worktype button.
 *
 * ```handlebars
 * {{search-facet-worktype-button
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-worktype-button
 */
export default class SearchFacetWorktypeButton extends Component {
    layout = layout;

    selectedTypes: string[] = [];
    type!: string;

    @computed('selectedTypes.[]')
    get selected(): boolean {
        return this.selectedTypes && this.selectedTypes.includes(this.type);
    }

    @computed('type')
    get label() {
        // TODO i18n-ize
        if (this.type === 'creative work') {
            return 'Not Categorized';
        }

        // title case work types: 'creative work' --> 'Creative Work'
        return this.type.replace(/\w\S*/g, capitalize);
    }

    @action
    click() {
        this.$().blur();
        this.sendAction('onClick', this.type);
    }

    @action
    toggleBody() {
        this.sendAction('toggleCollapse');
    }
}
