import $ from 'jquery';
import Controller from '@ember/controller';
import config from 'ember-get-config';
import pathJoin from 'ember-osf/utils/path-join';
import OSFAgnosticAuthControllerMixin from 'ember-osf/mixins/osf-agnostic-auth-controller';

export default class Application extends Controller.extend(OSFAgnosticAuthControllerMixin) {
    private signupUrl = `${pathJoin(config.OSF.url, 'register')}?${$.param({ next: window.location.href })}`;
}

declare module '@ember/controller' {
    interface IRegistry {
        application: Application;
    }
}
