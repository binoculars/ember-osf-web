import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember-decorators/object';
import { alias } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { observer } from '@ember/object';
import { localClassNames } from 'ember-osf-web/decorators/css-modules';
import Analytics from 'ember-osf-web/services/analytics';
import Theme from 'ember-osf-web/services/theme';
import SearchFacetTaxonomy, { TaxonomyItem } from '../component';
import styles from './styles';
import layout from './template';

@tagName('li')
@localClassNames('taxonomy-item')
export default class TaxonomyListItem extends Component.extend({
    /**
     * Using an observer here because the expandedList changes may occur before the nested item exists 🐔/🥚
     */
    // eslint-disable-next-line ember/no-observers
    expandedChanged: observer('expanded', function(this: TaxonomyListItem) {
        if (this.expanded) {
            this.fetchChildren();
        }
    }),
}) {
    layout = layout;
    styles = styles;

    @service analytics!: Analytics;
    @service theme!: Theme;

    item: TaxonomyItem = this.item;
    activeFilter: string[] = this.activeFilter;
    expandedList: string[] = this.expandedList;

    @alias('item.path')
    path!: string;

    @computed('activeFilter.[]', 'path')
    get checked(): boolean {
        return this.activeFilter.includes(this.path);
    }

    @computed('expandedList.[]', 'path')
    get expanded(): boolean {
        return this.expandedList.includes(this.path);
    }

    fetchChildren() {
        const { childCount, children } = this.item;

        if (childCount !== children.length) {
            SearchFacetTaxonomy.getTaxonomies(this.item, this.theme.provider!);
        }
    }

    @action
    toggleExpand() {
        const {
            expanded,
            item: { text, path },
        } = this;

        this.analytics.track(
            'tree',
            expanded ? 'contract' : 'expand',
            `Discover - ${text}`,
        );

        const method = expanded ? 'removeObject' : 'pushObject';
        this.expandedList[method](path);
    }
}
