
import { action, computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import I18N from 'ember-i18n/services/i18n';
import langs from 'npm:langs';
import { getUniqueList, termsFilter } from '../../utils/elastic-query';
import layout from './template';

interface Query {
    filter: any;
    value: any;
}

interface Options {
    title?: any;
}

/**
 * Copied from Ember-SHARE.  Language facet.
 *
 * ```handlebars
 * {{search-facet-language
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-language
 */
export default class SearchFacetLanguage extends Component {
    layout = layout;

    @service i18n!: I18N;

    state: any = this.state;
    previousState: any = [];
    key: any = this.key;
    options: Options = this.options;
    languages = langs.names();

    init(...args: any[]) {
        this._super(...args);

        const languageNames = (this.state || []).map((lang: any) => langs.where('3', lang).name);

        this.send('changeFilter', languageNames);
    }

    @computed('options.title')
    get placeholder() {
        return `${this.i18n.t('eosf.components.searchFacetLanguage.add')} ${this.options.title} filter`;
    }

    // changed: Ember.observer('state', function() {
    //     let state = Ember.isBlank(this.get('state')) ? [] : this.get('state');
    //     let previousState = this.get('previousState') || [];

    //     if (Ember.compare(previousState, state) !== 0) {
    //         let value = this.get('state');
    //         this.send('changeFilter', value ? value : []);
    //     }
    // }),

    buildQueryObject(selected: string | string[]): Query {
        const value: string[] = (Array.isArray(selected) ? selected : [selected])
            .map((lang: string) => (langs.where('name', lang) || langs.where('3', lang))['3']);

        return {
            filter: termsFilter(this.key, getUniqueList(value)),
            value,
        };
    }

    @computed('state')
    get selected(): string[] {
        return (this.state || []).map((lang: any) => langs.where('3', lang).name);
    }

    @action
    changeFilter(this: SearchFacetLanguage, languageNames: any) {
        const { filter, value } = this.buildQueryObject(languageNames || []);
        this.set('previousState', this.state);
        this.sendAction('onChange', this.key, filter, value);
    }
}
