import { action } from '@ember-decorators/object';
import { bool } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import DS from 'ember-data';
import I18N from 'ember-i18n/services/i18n';
import requiredAction from 'ember-osf-web/decorators/required-action';
import Node from 'ember-osf-web/models/node';
import CurrentUser from 'ember-osf-web/services/current-user';
import defaultTo from 'ember-osf-web/utils/default-to';
import styles from './styles';
import layout from './template';

export default class CollectionItemPicker extends Component.extend({
    initialLoad: task(function *(this: CollectionItemPicker) {
        this.setProperties({
            // didValidate: false,
            selected: null,
            items: yield this.get('findNodes').perform(),
        });
    }),

    findNodes: task(function *(this: CollectionItemPicker, filter?: string) {
        if (filter) {
            yield timeout(250);
        }

        const { user } = this.currentUser;
        if (!user) {
            return [];
        }

        const nodes = yield user.queryHasMany('nodes', {
            filter: filter ? { title: filter } : undefined,
        });

        return nodes;
    }).restartable(),

    didReceiveAttrs(this: CollectionItemPicker) {
        this.get('initialLoad').perform();
    },
}) {
    layout = layout;
    styles = styles;

    @service currentUser!: CurrentUser;
    @service i18n!: I18N;
    @service store!: DS.Store;

    @requiredAction projectSelected!: (value: Node) => void;
    @requiredAction validationChanged!: (isValid: boolean) => void;

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
