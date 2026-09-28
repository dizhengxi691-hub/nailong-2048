import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addRandomTile,
  canMove,
  cloneBoard,
  createInitialBoard,
  hasTarget,
  moveBoard,
  type Board,
  type Direction,
} from './game/engine';

type Snapshot = { board: Board; score: number; won: boolean };
type Phase = 'welcome' | 'playing' | 'won' | 'lost';

const BEST_KEY = 'milk-dragon-2048-best';
const SOUND_KEY = 'milk-dragon-2048-sound';

const tileNames: Record<number, string> = {
  2: '小奶团', 4: '探头', 8: '幼年', 16: '奶龙', 32: '开心奶龙', 64: '元气奶龙',
  128: '闪光奶龙', 256: '飞天奶龙', 512: '星星奶龙', 1024: '月亮奶龙', 2048: '奶龙王',
};

const readNumber = (key: string) => {
  try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; }
};

const readSound = () => {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
};

function playTone(enabled: boolean, value = 2) {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = Math.min(280 + Math.log2(value) * 34, 780);
    gain.gain.setValueAtTime(0.07, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    oscillator.addEventListener('ended', () => context.close());
  } catch { /* Audio is optional. */ }
}

function App() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readNumber(BEST_KEY));
  const [phase, setPhase] = useState<Phase>('welcome');
  const [previous, setPrevious] = useState<Snapshot | null>(null);
  const [won, setWon] = useState(false);
  const [sound, setSound] = useState(readSound);
  const [moveId, setMoveId] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const persistBest = useCallback((value: number) => {
    setBest(value);
    try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* Storage is optional. */ }
  }, []);

  const newGame = useCallback(() => {
    setBoard(createInitialBoard());
    setScore(0);
    setPrevious(null);
    setWon(false);
    setPhase('playing');
    setMoveId((id) => id + 1);
  }, []);

  const move = useCallback((direction: Direction) => {
    if (phase !== 'playing') return;
    const result = moveBoard(board, direction);
    if (!result.moved) return;

    setPrevious({ board: cloneBoard(board), score, won });
    const nextBoard = addRandomTile(result.board);
    const nextScore = score + result.score;
    setBoard(nextBoard);
    setScore(nextScore);
    setMoveId((id) => id + 1);
    if (nextScore > best) persistBest(nextScore);
    playTone(sound, result.score || 2);

    if (!won && hasTarget(nextBoard)) {
      setWon(true);
      setPhase('won');
    } else if (!canMove(nextBoard)) {
      setPhase('lost');
    }
  }, [best, board, persistBest, phase, score, sound, won]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Record<string, Direction> = {
        ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
        ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const undo = () => {
    if (!previous || phase === 'welcome') return;
    setBoard(cloneBoard(previous.board));
    setScore(previous.score);
    setWon(previous.won);
    setPhase('playing');
    setPrevious(null);
    setMoveId((id) => id + 1);
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try { localStorage.setItem(SOUND_KEY, next ? 'on' : 'off'); } catch { /* Storage is optional. */ }
    if (next) playTone(true, 8);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    touchStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };

  const continueGame = () => setPhase('playing');

  return (
    <main className="page-shell">
      <div className="sky-dots" aria-hidden="true" />
      <section className="game-card" aria-label="奶龙 2048 游戏">
        <img className="mascot-decoration" src="./nailong-character.png" alt="" aria-hidden="true" />
        <header className="hero">
          <div className="brand">
            <img src="./nailong-icon.png" alt="奶龙角色" />
            <div><p className="eyebrow">NAI LONG</p><h1>奶龙 <span>2048</span></h1></div>
          </div>
          <div className="scores" aria-label="分数">
            <div><span>最高分</span><strong>{best}</strong></div>
            <div className="current"><span>本局</span><strong>{score}</strong></div>
          </div>
        </header>

        <div className="toolbar">
          <p><strong>合成小龙，冲向 2048！</strong><span>滑动棋盘让相同数字相遇</span></p>
          <div className="actions">
            <button onClick={undo} disabled={!previous} aria-label="撤销一步">↶ <span>撤销</span></button>
            <button onClick={newGame}>↻ <span>新游戏</span></button>
            <button onClick={toggleSound} aria-label={sound ? '关闭声音' : '打开声音'}>{sound ? '♪' : '×'} <span>{sound ? '声音' : '静音'}</span></button>
          </div>
        </div>

        <div className="board-wrap">
          <div
            className="board"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { touchStart.current = null; }}
            role="application"
            aria-label="2048 棋盘，可上下左右滑动"
          >
            {board.flatMap((row, r) => row.map((value, c) => (
              <div className="cell" key={`cell-${r}-${c}`}>
                {value > 0 && (
                  <div className={`tile tile-${Math.min(value, 2048)}`} key={`${r}-${c}-${value}-${moveId}`}>
                    {value >= 8
                      ? <img className="tile-character" src="./nailong-character.png" alt="" aria-hidden="true" />
                      : <span className="tile-face" aria-hidden="true">{value === 2 ? '•ᴗ•' : '◉ᴗ◉'}</span>}
                    <strong>{value}</strong>
                    <small>{tileNames[value] ?? '传说龙'}</small>
                  </div>
                )}
              </div>
            )))}

            {phase !== 'playing' && (
              <div className="overlay" role="dialog" aria-modal="true" aria-label="游戏提示">
                <img src="./nailong-character.png" alt="奶龙" />
                {phase === 'welcome' && <><p className="bubble">嗷呜～一起合成吧！</p><h2>准备好了吗？</h2><span>手机滑动 · 电脑方向键 / WASD</span><button className="primary" onClick={() => setPhase('playing')}>开始游戏</button></>}
                {phase === 'won' && <><p className="bubble">太厉害啦！</p><h2>成功合成 2048</h2><span>你已经成为小龙合成大师</span><button className="primary" onClick={continueGame}>继续挑战</button><button className="text-button" onClick={newGame}>重新开始</button></>}
                {phase === 'lost' && <><p className="bubble">差一点点～</p><h2>没有可移动的位置了</h2><span>本局得分 {score}</span><button className="primary" onClick={newGame}>再来一局</button>{previous && <button className="text-button" onClick={undo}>撤销一步</button>}</>}
              </div>
            )}
          </div>
        </div>

        <footer>
          <div className="hint"><span>👆</span><p><strong>怎么玩</strong>上下左右滑动，相同数字会合并</p></div>
          <p className="legal">用户提供形象素材 · 发布前请确认使用授权 · v0.2.0</p>
        </footer>
        <div className="sr-only" aria-live="polite">当前分数 {score}，最高分 {best}</div>
      </section>
    </main>
  );
}

export default App;
