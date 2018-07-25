import { service } from '@ember-decorators/service';
import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';
import CollectionProvider from 'ember-osf-web/models/collection-provider';
import Theme from 'ember-osf-web/services/theme';

export default class Submit extends Route {
    @service theme!: Theme;

    loadModel = task(function *(this: Submit): IterableIterator<any> {
        const provider = this.theme.provider as CollectionProvider;
        const primaryCollection = yield provider.primaryCollection;

        return {
            provider,
            primaryCollection,
        };
    });

    model(this: Submit): any {
        return {
            taskInstance: this.get('loadModel').perform(),
        };
    }
}
