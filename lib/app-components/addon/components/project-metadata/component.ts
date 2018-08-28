import { tagName } from '@ember-decorators/component';
import { action } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { task } from 'ember-concurrency';
import DS from 'ember-data';
import I18N from 'ember-i18n/services/i18n';
import requiredAction from 'ember-osf-web/decorators/required-action';
import Node from 'ember-osf-web/models/node';
import Analytics from 'ember-osf-web/services/analytics';
import Toast from 'ember-toastr/services/toast';
import styles from './styles';
import layout from './template';

@tagName('')
export default class ProjectMetadata extends Component {
    layout = layout;
    styles = styles;

    @service analytics!: Analytics;
    @service i18n!: I18N;
    @service store!: DS.Store;
    @service toast!: Toast;

    node: Node = this.node;
    @requiredAction continue!: () => void;

    reset = task(function *(this: ProjectMetadata) {
        this.node.rollbackAttributes();
        yield this.node.reload();
    });

    save = task(function *(this: ProjectMetadata) {
        try {
            yield this.node.save();
            this.toast.success(this.i18n.t('app_components.project_metadata.save_success'));
            this.continue();
        } catch (e) {
            this.toast.error(this.i18n.t('app_components.project_metadata.save_error'));
        }
    });

    @action
    addTag(this: ProjectMetadata, tag: string) {
        this.analytics.click('button', 'Collection - Submit - Add tag');
        this.node.set('tags', [...this.node.tags.slice(), tag].sort());
    }

    @action
    removeTagAtIndex(this: ProjectMetadata, index: number) {
        this.analytics.click('button', 'Collections - Submit - Remove tag');
        this.node.set('tags', this.node.tags.slice().removeAt(index));
    }
}
