// import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember-decorators/object';
import { alias } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import DS from 'ember-data';
import I18N from 'ember-i18n/services/i18n';
import License from 'ember-osf-web/models/license';
import Node from 'ember-osf-web/models/node';
import Provider from 'ember-osf-web/models/provider';
import Analytics from 'ember-osf-web/services/analytics';
import Theme from 'ember-osf-web/services/theme';

// @tagName('')
export default class LicensePicker extends Component.extend({
    didReceiveAttrs(this: LicensePicker) {
        this.get('queryLicenses').perform();
    },

    queryLicenses: task(function *(this: LicensePicker, name?: string) {
        if (name) {
            yield timeout(250);
        }

        const licensesAcceptable = yield this.provider.queryHasMany('licensesAcceptable', {
            page: { size: 20 },
            filter: name ? { name } : undefined,
        });

        this.setProperties({ licensesAcceptable });
    }).restartable(),
}) {
    @service analytics!: Analytics;
    @service i18n!: I18N;
    @service store!: DS.Store;
    @service theme!: Theme;

    showText: boolean = false;
    node: Node = this.node;
    licensesAcceptable: License[] = [];
    selected?: License;

    @alias('theme.provider') provider!: Provider;

    /**
     * TODO: Dynamic computed properties
     */
    @computed('selected.text', 'node.nodeLicense.{year,copyrightHolders}')
    get licenseText(): string {
        let result = this.selected!.text || '';

        if (!this.node.nodeLicense) {
            return result;
        }

        for (const [key, value] of Object.entries(this.node.nodeLicense)) {
            result = result.replace(new RegExp(`{{${key}}}`), value);
        }

        return result;
    }

    @action
    changeLicense(this: LicensePicker, selected: License) {
        if (selected.requiredFields && !this.node.nodeLicense) {
            this.node.set('nodeLicense', this.node.nodeLicenseDefaults);
        }

        this.setProperties({
            selected,
        });
    }
}
