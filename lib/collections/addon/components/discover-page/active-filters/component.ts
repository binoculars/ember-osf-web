import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import Theme from 'collections/services/theme';

export default class ActiveFilters extends Component {
    @service theme!: Theme;
    activeFilters: any[] = this.activeFilters;
    filterReplace: any = this.filterReplace;
}
