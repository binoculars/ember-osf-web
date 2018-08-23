import { tagName } from '@ember-decorators/component';
import Component from '@ember/component';
import requiredAction from 'ember-osf-web/decorators/required-action';
import defaultTo from 'ember-osf-web/utils/default-to';
import { FacetContexts } from '../../component';
import styles from './styles';
import layout from './template';

@tagName('')
export default class ActiveFiltersFilter extends Component {
    layout = layout;
    styles = styles;

    facet: keyof FacetContexts = this.facet;
    item: any = this.item;
    text: string = this.text;
    ariaLabel: string = this.ariaLabel;
    hide: boolean = defaultTo(this.hide, false);
    extraClass: string = defaultTo(this.extraClass, '');

    @requiredAction removeFilterItem!: (facet: keyof FacetContexts, item: any) => void;
}
