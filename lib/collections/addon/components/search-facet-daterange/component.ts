import { action } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { run, scheduleOnce } from '@ember/runloop';
import I18N from 'ember-i18n/services/i18n';
import moment from 'moment';
import { dateRangeFilter } from '../../utils/elastic-query';
import layout from './template';

const DATE_FORMAT = 'Y-MM-DD';

interface Picker {
    startDate: Date;
    endDate: Date;
}

/**
 * Copied from Ember-SHARE.  Datepicker facet. Need to add styles to client application
 * (@import 'daterangepicker.scss';)
 *
 * ```handlebars
 * {{search-facet-daterange
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-daterange
 */
export default class SearchFacetDaterange extends Component.extend({
    init(this: SearchFacetDaterange, ...args: any[]) {
        this._super(...args);
        // this.updateFilter(this.get('state.start'), this.get('state.end'));
    },

    didInsertElement(this: SearchFacetDaterange, ...args: any[]) {
        this._super(...args);

        const dateRanges = {
            'Past week': [moment().subtract(1, 'week'), moment()],
            'Past month': [moment().subtract(1, 'month'), moment()],
            'Past year': [moment().subtract(1, 'year'), moment()],
            'Past decade': [moment().subtract(10, 'year'), moment()],
        };

        const picker = this.$('.date-range');

        (picker as any).daterangepicker({
            ranges: dateRanges,
            autoUpdateInput: false,
            locale: { cancelLabel: 'Clear' },
        });

        picker.on('apply.daterangepicker', (_, { startDate, endDate }: Picker) => {
            run(() => {
                this.updateFilter(startDate, endDate);
            });
        });

        picker.on('cancel.daterangepicker', () => {
            run(() => {
                this.send('clear');
            });
        });

        scheduleOnce('actions', this, function(this: SearchFacetDaterange) {
            // this.filterUpdated();
        });
    },
}) {
    layout = layout;

    @service i18n!: I18N;

    state: any[] = this.state;
    previousState: any[] = this.previousState || [];
    key: string = this.key;
    pickerValue: any = this.pickerValue;

    // changed: Ember.observer('state.start', 'state.end', function() {
    //     let start = this.get('state.start');
    //     let end = this.get('state.end');
    //     if (start !== this.get('statePrevious.start') || end !== this.get('statePrevious.end')) {
    //         this.set('pickerValue', `${moment(start).format(DATE_FORMAT)} - ${moment(end).format(DATE_FORMAT)}`);
    //         this.updateFilter(start, end);
    //     }
    // }),

    // filterUpdated: Ember.observer('state', function() {
    //     let state = this.get('state');
    //     if (state.start) {
    //         let start = moment(this.get('state.start'));
    //         let end = moment(this.get('state.end'));
    //         let picker = this.$('.date-range').data('daterangepicker');
    //         picker.setStartDate(start);
    //         picker.setEndDate(end);
    //         if (picker.chosenLabel && picker.chosenLabel !== 'Custom Range') {
    //             this.set('pickerValue', picker.chosenLabel);
    //         } else {
    //             this.set('pickerValue', `${start.format(DATE_FORMAT)} - ${end.format(DATE_FORMAT)}`);
    //         }
    //     } else {
    //         this.noFilter();
    //     }
    // })

    buildQueryObject(start: Date | null, end: Date | null) {
        return dateRangeFilter(this.key, start, end);
    }

    updateFilter(this: SearchFacetDaterange, start: Date | null, end: Date | null) {
        const value = start && end ?
            { start: moment(start).format(DATE_FORMAT), end: moment(end).format(DATE_FORMAT) } :
            { start: '', end: '' };

        this.set('previousState', this.state);
        this.sendAction('onChange', this.key, this.buildQueryObject(start, end), value);
    }

    noFilter(this: SearchFacetDaterange) {
        this.set('pickerValue', `${this.get('i18n').t('eosf.components.searchFacetDaterange.allTime')}`);
    }

    @action
    clear(this: SearchFacetDaterange) {
        this.noFilter();
        this.set('previousState', this.state);
        this.sendAction('onChange', this.get('key'), this.buildQueryObject(null, null), { start: '', end: '' });
    }
}
