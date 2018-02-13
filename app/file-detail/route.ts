import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import Analytics from 'ember-osf/mixins/analytics';

export default class FileDetail extends Route.extend(Analytics) {
    private currentUser = service('currentUser');

    private model(params) {
        return hash({
            file: this.store.findRecord('file', params.file_id),
            user: this.store.findRecord('file', params.file_id).then(file => file.get('user')).then(user => user.reload()),
        });
    }

    private afterModel(model, transition) {
        if (model.user.id !== this.get('currentUser.currentUserId')) {
            transition.send('track', 'page view', 'track', 'Quick Files - File detail page view');
        }
    }

    private resetController(controller, isExiting, transition) {
        if (isExiting && transition.targetName !== 'error') {
            controller.set('revision', null);
        }
    }
}

declare module '@ember/routing/route' {
    interface IRegistry {
        'file-detail': FileDetail;
    }
}
