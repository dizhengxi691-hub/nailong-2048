export const SIZE = 4;
export const TARGET = 2048;

export type Board = number[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

export type MoveResult = {
  board: Board;
  score: number;
  moved: boolean;
};

export const emptyBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));

export const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

export function slideLine(line: number[]): { line: number[]; score: number } {
  const compact = line.filter(Boolean);
  const merged: number[] = [];
  let score = 0;

  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const value = compact[index] * 2;
      merged.push(value);
      score += value;
      index += 1;
    } else {
      merged.push(compact[index]);
    }
  }

  return {
    line: [...merged, ...Array<number>(SIZE - merged.length).fill(0)],
    score,
  };
}

const sameBoard = (a: Board, b: Board): boolean =>
  a.every((row, r) => row.every((value, c) => value === b[r][c]));

export function moveBoard(board: Board, direction: Direction): MoveResult {
  const next = emptyBoard();
  let score = 0;

  for (let outer = 0; outer < SIZE; outer += 1) {
    const source = Array.from({ length: SIZE }, (_, inner) => {
      if (direction === 'left') return board[outer][inner];
      if (direction === 'right') return board[outer][SIZE - 1 - inner];
      if (direction === 'up') return board[inner][outer];
      return board[SIZE - 1 - inner][outer];
    });

    const result = slideLine(source);
    score += result.score;

    result.line.forEach((value, inner) => {
      if (direction === 'left') next[outer][inner] = value;
      else if (direction === 'right') next[outer][SIZE - 1 - inner] = value;
      else if (direction === 'up') next[inner][outer] = value;
      else next[SIZE - 1 - inner][outer] = value;
    });
  }

  return { board: next, score, moved: !sameBoard(board, next) };
}

export function addRandomTile(board: Board, random = Math.random): Board {
  const empty: Array<[number, number]> = [];
  board.forEach((row, r) => row.forEach((value, c) => value === 0 && empty.push([r, c])));
  if (!empty.length) return cloneBoard(board);

  const next = cloneBoard(board);
  const [row, col] = empty[Math.floor(random() * empty.length)];
  next[row][col] = random() < 0.9 ? 2 : 4;
  return next;
}

export function createInitialBoard(random = Math.random): Board {
  return addRandomTile(addRandomTile(emptyBoard(), random), random);
}

export const hasTarget = (board: Board): boolean => board.some((row) => row.includes(TARGET));

export function canMove(board: Board): boolean {
  if (board.some((row) => row.includes(0))) return true;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (col + 1 < SIZE && board[row][col] === board[row][col + 1]) return true;
      if (row + 1 < SIZE && board[row][col] === board[row + 1][col]) return true;
    }
  }
  return false;
}
