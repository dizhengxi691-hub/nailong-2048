import { describe, expect, it } from 'vitest';
import { addRandomTile, canMove, moveBoard, slideLine, type Board } from './engine';

describe('slideLine', () => {
  it('merges each tile only once', () => {
    expect(slideLine([2, 2, 2, 2])).toEqual({ line: [4, 4, 0, 0], score: 8 });
  });

  it('does not chain a newly merged tile', () => {
    expect(slideLine([2, 2, 4, 0])).toEqual({ line: [4, 4, 0, 0], score: 4 });
  });

  it('compresses gaps before merging', () => {
    expect(slideLine([4, 0, 4, 4])).toEqual({ line: [8, 4, 0, 0], score: 8 });
  });
});

describe('moveBoard', () => {
  const board: Board = [
    [2, 0, 2, 0],
    [0, 4, 0, 4],
    [8, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  it('moves and scores left', () => {
    expect(moveBoard(board, 'left')).toEqual({
      board: [
        [4, 0, 0, 0],
        [8, 0, 0, 0],
        [8, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      score: 12,
      moved: true,
    });
  });

  it('does not report an unchanged move', () => {
    expect(moveBoard([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'left').moved).toBe(false);
  });
});

describe('board state', () => {
  it('uses an injectable random source', () => {
    const next = addRandomTile([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], () => 0);
    expect(next[0][0]).toBe(2);
  });

  it('detects a full locked board', () => {
    expect(canMove([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]])).toBe(false);
  });

  it('keeps playing when adjacent values match', () => {
    expect(canMove([[2, 2, 4, 8], [4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]])).toBe(true);
  });
});
