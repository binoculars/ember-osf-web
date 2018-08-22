import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember-decorators/object';
import { alias } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { localClassNames } from 'ember-osf-web/decorators/css-modules';
import Analytics from 'ember-osf-web/services/analytics';
import Theme from 'ember-osf-web/services/theme';
import SearchFacetTaxonomy, { TaxonomyItem } from '../component';
import styles from './styles';
import layout from './template';

@tagName('li')
@localClassNames('taxonomy-item')
export default class TaxonomyListItem extends Component {
    layout = layout;
    styles = styles;

    @service analytics!: Analytics;
    @service theme!: Theme;

    item: TaxonomyItem = this.item;
    activeFilter: string[] = this.activeFilter;
    expandedList: string[] = this.expandedList;

    @alias('item.path')
    path!: string;

    @computed('item.text', 'activeFilter.[]')
    get checked() {
        return this.activeFilter.includes(this.item.text);
    }

    @computed('item.text', 'expandedList.[]')
    get expanded() {
        return this.expandedList.includes(this.item.text);
    }

    @action
    toggleExpand() {
        const { text, childCount, children } = this.item;

        this.analytics.track(
            'tree',
            this.expanded ? 'contract' : 'expand',
            `Discover - ${text}`,
        );

        const method = this.expanded ? 'removeObject' : 'pushObject';
        this.expandedList[method](text);

        if (childCount !== children.length) {
            SearchFacetTaxonomy.getTaxonomies(this.item, this.theme.provider!);
        }
    }
}