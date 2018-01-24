import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import Analytics from 'ember-osf/mixins/analytics';

export default class extends Route.extend(Analytics) {
    private currentUser = service();

    async model(params) {
        const file = await this.store.findRecord('file', params.file_id);
        const user = await (await file.get('user')).reload();

        return {
            file,
            user,
        };
    }

    afterModel(model, transition) {
        if (model.user.id !== this.get('currentUser.currentUserId')) {
            transition.send('track', 'page view', 'track', 'Quick Files - File detail page view');
        }
    }

    resetController(controller, isExiting, transition) {
        if (isExiting && transition.targetName !== 'error') {
            controller.set('revision', null);
        }
    }
}
