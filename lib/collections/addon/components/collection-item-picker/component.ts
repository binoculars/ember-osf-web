import { action } from '@ember-decorators/object';
import { bool } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import DS from 'ember-data';
import I18N from 'ember-i18n/services/i18n';
import requiredAction from 'ember-osf-web/decorators/required-action';
import Collection from 'ember-osf-web/models/collection';
import Node from 'ember-osf-web/models/node';
import { QueryHasManyResult } from 'ember-osf-web/models/osf-model';
import CurrentUser from 'ember-osf-web/services/current-user';
import authenticatedAJAX from 'ember-osf-web/utils/ajax-helpers';
import defaultTo from 'ember-osf-web/utils/default-to';
import $ from 'jquery';
import styles from './styles';
import layout from './template';

export default class CollectionItemPicker extends Component.extend({
    didReceiveAttrs(this: CollectionItemPicker) {
        if (this.collection) {
            this.get('initialLoad').perform();
        }
    },

    initialLoad: task(function *(this: CollectionItemPicker) {
        this.setProperties({
            selected: null,
            items: yield this.get('findNodes').perform(),
        });
    }),

    findNodes: task(function *(this: CollectionItemPicker, filter?: string, page: number = 1) {
        if (filter) {
            yield timeout(250);
        }

        const { user } = this.currentUser;

        if (!user) {
            return [];
        }

        const nodes: QueryHasManyResult<Node> = yield user.queryHasMany<Node>('nodes', {
            filter: filter ? { title: filter } : undefined,
            page,
        });

        // Filter out nodes that are already in the current collection
        const nodeIds = nodes.mapBy('id').join();

        const params = $.param({
            'filter[id]': nodeIds,
            'fields[collected-metadata]': '', // sparse fieldset optimization (only need IDs)
        });

        const { data } = yield authenticatedAJAX({
            url: `${this.collection.links.self}collected_metadata/?${params}`,
        });

        // Collected-metadata IDs are the same as node IDs
        const cgmIds: string[] = data.mapBy('id');

        const filteredNodes = nodes.filter(({ id }) => !cgmIds.includes(id));

        const { meta } = nodes;

        // Check if all of the nodes from the current list are in the collection
        if (!filteredNodes.length && meta.total > meta.per_page * page) {
            return this.findNodes.perform(filter, page + 1);
        }

        return filteredNodes;
    }).restartable(),
}) {
    layout = layout;
    styles = styles;

    @service currentUser!: CurrentUser;
    @service i18n!: I18N;
    @service store!: DS.Store;

    @requiredAction projectSelected!: (value: Node) => void;
    @requiredAction validationChanged!: (isValid: boolean) => void;

    collection: Collection = this.collection;
    selected: Node | null = defaultTo(this.selected, null);
    items: Node[] = [];

    @bool('selected') isValid!: boolean;

    @action
    valueChanged(this: CollectionItemPicker, value?: Node): void {
        if (value) {
            this.set('selected', value);
            this.projectSelected(value);
        }

        this.validationChanged(this.isValid);
    }
}
