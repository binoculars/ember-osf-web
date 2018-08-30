import { tagName } from '@ember-decorators/component';
import { computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import I18N from 'ember-i18n/services/i18n';
import { serviceLinks } from 'ember-osf-web/const/service-links';
import requiredAction from 'ember-osf-web/decorators/required-action';
import Analytics from 'ember-osf-web/services/analytics';
import Theme from 'ember-osf-web/services/theme';
import Session from 'ember-simple-auth/services/session';
import styles from './styles';
import layout from './template';

type ObjectType = 'collection' | 'preprint' | 'registration';

@tagName('')
export default class BrandedNavbar extends Component {
    layout = layout;
    styles = styles;

    @service analytics!: Analytics;
    @service i18n!: I18N;
    @service session!: Session;
    @service theme!: Theme;

    objectType: ObjectType = this.objectType;
    signupUrl: string = this.signupUrl;

    myProjectsUrl = serviceLinks.myProjects;

    key = 'collections.navbar.brand';

    @computed('i18n.locale', 'theme.provider')
    get brandTitle(): string {
        const { name } = this.theme.provider!;

        return this.i18n.t(this.key, { name });
    }

    @requiredAction loginAction!: () => void;
}
