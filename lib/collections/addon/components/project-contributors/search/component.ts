import { action } from '@ember-decorators/object';
import { alias } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import { DS } from 'ember-data';
import User from 'ember-osf-web/models/user';
import Analytics from 'ember-osf-web/services/analytics';

const nameFields = [
    'full_name',
    'given_name',
    'middle_names',
    'family_name',
].join();

export default class Search extends Component {
    @service analytics!: Analytics;
    @service store!: DS.Store;

    query: string = '';
    page: number = 1;
    showUnregisteredForm: boolean = false;

    search = task(function *(this: Search) {
        yield timeout(250);
        this.analytics.track('list', 'filter', 'Collections - Contributors - Search');

        const results = yield this.store.query('user', {
            filter: {
                [nameFields]: this.query,
            },
            page: this.page,
        });

        return results;
    }).restartable();

    @alias('search.lastSuccessful.value') results?: DS.AdapterPopulatedRecordArray<User>;
    @alias('results.meta.total_pages') totalPages?: number;

    @action
    findUsers(this: Search) {
        if (!this.query) {
            return;
        }

        this.get('search').perform();
    }
}
