import { action } from '@ember-decorators/object';
import { alias } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Controller from '@ember/controller';
import Collection from 'ember-osf-web/models/collection';
import CollectionProvider from 'ember-osf-web/models/collection-provider';
import Node from 'ember-osf-web/models/node';
import Analytics from 'ember-osf-web/services/analytics';
import CurrentUser from 'ember-osf-web/services/current-user';

export default class Submit extends Controller {
    @service analytics!: Analytics;
    @service currentUser!: CurrentUser;

    tags: string[] = [];
    collectionItem!: Node;
    isProjectSelectorValid: boolean = false;

    @alias('model.taskInstance.value.provider') provider!: CollectionProvider;
    @alias('model.taskInstance.value.primaryCollection') collection!: Collection;

    @action
    projectSelected(this: Submit, item: Node) {
        item.set('collectable', true);
        this.set('collectionItem', item);
    }

    @action
    addTag(this: Submit, tag: string) {
        this.analytics.click('button', 'Collection - Submit - Add tag');
        this.collectionItem.set('tags', [...this.collectionItem.tags.slice(), tag].sort());
    }

    @action
    removeTagAtIndex(this: Submit, index: number) {
        this.analytics.click('button', 'Collections - Submit - Remove tag');
        this.collectionItem.set('tags', this.collectionItem.tags.slice().removeAt(index));
    }

    @action
    collectedTypeChanged() {
        return true;
    }

    @action
    statusChanged() {
        return true;
    }
}
