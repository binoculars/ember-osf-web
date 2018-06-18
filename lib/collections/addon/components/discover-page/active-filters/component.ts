import { action } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import Theme from 'collections/services/theme';

export default class ActiveFilters extends Component {
    @service theme!: Theme;
    activeFilters: any[] = this.activeFilters;
    filterReplace: any = this.filterReplace;

    @action
    removeFilterItem(filter: any, item: any) {
        this.activeFilters[filter].removeObject(item);
    }
}
