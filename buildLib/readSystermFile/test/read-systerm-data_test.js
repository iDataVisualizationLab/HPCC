import {ReadSystermData} from '../read-systerm-data.js';
import {fixture, html} from '@open-wc/testing';

const assert = chai.assert;

suite('read-systerm-data', () => {
  test('is defined', () => {
    const el = document.createElement('read-systerm-data');
    assert.instanceOf(el, ReadSystermData);
  });

  test('renders with default values', async () => {
    const el = await fixture(html`<read-systerm-data></read-systerm-data>`);
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('renders with a set name', async () => {
    const el = await fixture(html`<read-systerm-data name="Test"></read-systerm-data>`);
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, Test!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('handles a click', async () => {
    const el = await fixture(html`<read-systerm-data></read-systerm-data>`);
    const button = el.shadowRoot.querySelector('button');
    button.click();
    await el.updateComplete;
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 1</button>
      <slot></slot>
    `
    );
  });
});
