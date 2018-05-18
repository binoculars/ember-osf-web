import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import layout from './template';

/**
 * Copied from Ember-SHARE.
 *
 * ```handlebars
 * {{search-facet-worktype
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-worktype-hierarchy
 */

export default class SearchFacetWorktypeHierarchy extends Component.extend({
    init(...args: any[]) {
        this._super(...args);
        // this.set('toggleState', this.get('defaultCollapsed'));
    },
}) {
    layout = layout;
    category = 'filter-facets';
    state: string[] = this.state;
    toggleState: boolean = false;

    @computed('state')
    get selected(): string[] {
        return this.state || [];
    }

    @action
    toggle(type: any) {
        this.sendAction('onClick', type);
    }

    @action
    toggleBody() {
        this.toggleProperty('toggleState');
    }
}
