import { render } from '@ember/test-helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { setupRenderingTest } from 'ember-qunit';
import { TestContext } from 'ember-test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';

module('Integration | Component | noteworthy-and-popular-project', hooks => {
    setupRenderingTest(hooks);
    setupMirage(hooks);

    hooks.beforeEach(function(this: TestContext) {
        this.store = this.owner.lookup('service:store');
    });

    test('it renders', async function(assert) {
        const node = server.create('node');
        const project = await this.store.findRecord('node', node.id);
        this.set('node', project);

        await render(hbs`{{noteworthy-and-popular-project project=this.node}}`);
        assert.dom('[class*="NoteworthyProject"]').exists();
    });
});
