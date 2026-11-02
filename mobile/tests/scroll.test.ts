import assert from 'node:assert/strict';
import test from 'node:test';

import { createScrollFollow, isNearEnd } from '../src/chat/scroll.ts';

test('a reply follows the reader at the end even when its new height temporarily hides the end', () => {
  const follow = createScrollFollow();
  follow.contentChanged();
  follow.endVisible(false);
  assert.equal(follow.takeScroll(), true);
  assert.equal(follow.takeScroll(), false);
});

test('a reply does not interrupt reading older messages', () => {
  const follow = createScrollFollow();
  follow.endVisible(false);
  follow.contentChanged();
  assert.equal(follow.takeScroll(), false);
});

test('starting a drag cancels an already scheduled automatic scroll', () => {
  const follow = createScrollFollow();
  follow.contentChanged();
  follow.beginDrag();
  follow.endVisible(false);
  follow.endDrag();
  assert.equal(follow.takeScroll(), false);
});

test('jumping to the latest message resumes following future replies', () => {
  const follow = createScrollFollow();
  follow.endVisible(false);
  follow.reveal();
  assert.equal(follow.takeScroll(), true);
  follow.contentChanged();
  assert.equal(follow.takeScroll(), true);
});

test('new content during a drag waits until the drag finishes', () => {
  const follow = createScrollFollow();
  follow.beginDrag();
  follow.contentChanged();
  assert.equal(follow.takeScroll(), false);
  follow.endDrag();
  assert.equal(follow.takeScroll(), true);
});

test('end detection includes space occupied by the composer and keyboard', () => {
  assert.equal(isNearEnd(600, 400, 1000), true);
  assert.equal(isNearEnd(600, 400, 1000, 300), false);
  assert.equal(isNearEnd(850, 400, 1000, 300), true);
  assert.equal(isNearEnd(0, 700, 300, 90), true);
});

test('moving away during a reply cancels following after the finger is released', () => {
  const follow = createScrollFollow();
  follow.beginDrag();
  follow.contentChanged();
  follow.endVisible(false);
  follow.endDrag();
  assert.equal(follow.takeScroll(), false);
});

test('a new conversation cancels scrolling queued for the previous one', () => {
  const follow = createScrollFollow();
  follow.reveal();
  follow.reset();
  assert.equal(follow.takeScroll(), false);
});
