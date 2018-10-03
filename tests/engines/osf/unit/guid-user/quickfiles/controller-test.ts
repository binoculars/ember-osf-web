import Service from '@ember/service';
import { setupEngineTest } from 'ember-osf-web/tests/helpers/engines';
import { TestContext } from 'ember-test-helpers';
import { module, test } from 'qunit';

const analyticsStub = Service.extend();
const currentUserStub = Service.extend();
const i18nStub = Service.extend();
const toastStub = Service.extend();

module('Unit | Controller | guid-user/quickfiles', hooks => {
    setupEngineTest(hooks, 'osf');

    hooks.beforeEach(function(this: TestContext) {
        this.owner.register('service:analytics', analyticsStub);
        this.owner.register('service:currentUser', currentUserStub);
        this.owner.register('service:i18n', i18nStub);
        this.owner.register('service:toast', toastStub);
    });

    // Replace this with your real tests.
    test('it exists', function(assert) {
        const controller = this.owner.lookup('controller:guid-user/quickfiles');
        assert.ok(controller);
    });
});