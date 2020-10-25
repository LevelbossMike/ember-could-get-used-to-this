import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { tracked } from 'tracked-built-ins';

import { modifier } from 'ember-could-get-used-to-this';

module('functional modifiers', (hooks) => {
  setupRenderingTest(hooks);

  test('functions can be used as modifiers', async function (assert) {
    this.owner.register(
      'modifier:set-text',
      modifier((element, [text]) => (element.innerText = text))
    );

    await render(hbs`<span {{set-text 'hello'}}></span>`);

    assert.equal(this.element.textContent.trim(), 'hello');
  });

  test('functional modifiers update if args update', async function (assert) {
    this.owner.register(
      'modifier:set-text',
      modifier((element, [text]) => (element.innerText = text))
    );

    this.text = 'hello';

    await render(hbs`<span {{set-text this.text}}></span>`);

    assert.equal(this.element.textContent.trim(), 'hello');

    this.set('text', 'world');

    await settled();

    assert.equal(this.element.textContent.trim(), 'world');
  });

  test('functional modifiers update if tracked state used within updates', async function (assert) {
    this.owner.register(
      'modifier:set-text',
      modifier((element, [{ text }]) => (element.innerText = text))
    );

    this.value = tracked({ text: 'hello' });

    await render(hbs`<span {{set-text this.value}}></span>`);

    assert.equal(this.element.textContent.trim(), 'hello');

    this.value.text = 'world';

    await settled();

    assert.equal(this.element.textContent.trim(), 'world');
  });

  test('functional modifiers cache correctly', async function (assert) {
    let count = 0;

    this.owner.register(
      'modifier:set-text',
      modifier((element, [text]) => {
        count++;
        element.innerText = text;
      })
    );

    this.first = 1;
    this.second = 2;

    await render(hbs`<span {{set-text this.first}}></span> {{this.second}}`);

    assert.equal(this.element.textContent.trim(), '1 2');
    assert.equal(count, 1, 'calculated once');

    this.set('second', 3);

    await settled();
    assert.equal(this.element.textContent.trim(), '1 3');
    assert.equal(count, 1, 'returned cached value');

    this.set('first', 2);

    assert.equal(this.element.textContent.trim(), '2 3');
    assert.equal(count, 2, 'cached value updated');
  });

  test('functional modifiers can return destructor', async function (assert) {
    let active = 0;

    this.owner.register(
      'modifier:set-text',
      modifier((element, [text]) => {
        active++;
        element.innerText = text;

        return () => active--;
      })
    );

    this.text = 'hello';

    await render(
      hbs`{{#if this.show}}<span {{set-text this.text}}></span>{{/if}}`
    );

    assert.equal(this.element.textContent.trim(), '');
    assert.equal(active, 0, 'no active modifiers yet');

    this.set('show', true);
    await settled();

    assert.equal(this.element.textContent.trim(), 'hello');
    assert.equal(active, 1, 'one active modifier');

    this.set('text', 'world');
    await settled();

    assert.equal(this.element.textContent.trim(), 'world');
    assert.equal(active, 1, 'one active modifier');

    this.set('show', false);
    await settled();

    assert.equal(this.element.textContent.trim(), '');
    assert.equal(active, 0, 'modifiers deactivated');
  });

  test('functional modifiers can be passed named args', async function (assert) {
    let setText = modifier((element, positional, { text }) => (element.innerText = text));
    this.owner.register('modifier:set-text', setText);

    await render(hbs`<span {{set-text text='hello'}}></span>`);

    assert.equal(this.element.textContent.trim(), 'hello');
  });
});
