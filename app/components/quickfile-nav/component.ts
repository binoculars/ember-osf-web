import Component from '@ember/component';

export default class QuickfileNav extends Component {
    private tagName = 'nav';
    private classNames = ['navbar', 'osf-project-navbar', 'row'];
    private attributeBindings = ['role'];
    private role = 'navigation';
}

declare module '@ember/component' {
    interface IRegistry {
        'quickfile-nav': QuickfileNav;
    }
}
