import { action } from '@ember-decorators/object';
// import { alias } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
// import { task, timeout } from 'ember-concurrency';
import { DS } from 'ember-data';
import requiredAction from 'ember-osf-web/decorators/required-action';
import Contributor from 'ember-osf-web/models/contributor';
import Analytics from 'ember-osf-web/services/analytics';

export default class UnregisteredContributor extends Component {
    @service analytics!: Analytics;
    @service store!: DS.Store;

    model?: Contributor;
    node: Node = this.node;

    @requiredAction close!: () => void;

    // search = task(function *(this: Search, query: string, page: number) {
    //     yield timeout(250);
    //     this.analytics.track('list', 'filter', 'Collections - Contributors - Search');

    //     const results = yield this.store.query('user', {
    //         filter: {
    //             [nameFields]: query,
    //         },
    //         page,
    //     });

    //     this.setProperties({ results });
    // }).restartable();

    // didReceiveAttrs(this: UnregisteredContributor) {
    //     debugger;
    // }

    reset(this: UnregisteredContributor) {
        if (this.model) {
            this.model.rollbackAttributes();
        }

        const model = this.store.createRecord('contributor', {
            node: this.node,
            isUnregistered: true,
        });

        this.setProperties({ model });
    }

    @action
    cancel(this: UnregisteredContributor) {
        this.reset();
        this.close();
    }
}
