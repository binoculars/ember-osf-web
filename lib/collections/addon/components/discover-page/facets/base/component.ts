import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import Theme from 'collections/services/theme';
import Analytics from 'ember-osf-web/services/analytics';

export default class Base extends Component {
    @service analytics!: Analytics;
    @service theme!: Theme;
}
