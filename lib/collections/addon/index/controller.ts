import { service } from '@ember-decorators/service';
import Controller from '@ember/controller';

import Theme from 'collections/services/theme';

export default class Index extends Controller {
    @service theme!: Theme;
}
