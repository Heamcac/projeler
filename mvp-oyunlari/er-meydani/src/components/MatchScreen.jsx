import React, { useEffect, useMemo, useState } from 'react';
import ActionCard from './ActionCard';
import TimingBar from './TimingBar';
import ResultModal from './ResultModal';
import { ACTION_CARDS, getCard, getRoundStance } from '../logic/cardRules';
import { chooseOpponentMove } from '../logic/aiOpponent';
import { applyMove, createOpponent, getRewards, MAX_ROUNDS, ROUND_SECONDS } from '../logic/matchSystem';
import { getPlayerStats, getTimingWindow } from '../logic/upgradeSystem';

export default function MatchScreen({ save, wrestler, difficulty, onFinish, onAgain, onExit }) {
  const [round, setRound] = useState(1);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [player, setPlayer] = useState(() => getPlayerStats(save, wrestler));
  const [opponent, setOpponent] = useState(() => createOpponent(difficulty));
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState(null);
  const [banner, setBanner] = useState('Raunt 1');
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);

  const stance = useMemo(() => getRoundStance(round), [round]);
  const timingWindow = getTimingWindow(save);

  useEffect(() => {
    if (paused || pending || result) return;
    const timer = setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          advanceRound();
          return ROUND_SECONDS;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, pending, result, round, player, opponent]);

  useEffect(() => {
    if (paused || !banner) return;
    const timer = setTimeout(() => setBanner(''), 1100);
    return () => clearTimeout(timer);
  }, [banner, paused]);

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key !== 'Escape' && event.key.toLowerCase() !== 'p') return;
      event.preventDefault();
      setPaused((value) => !value);
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  function selectCard(cardId) {
    if (paused || pending || result) return;
    const opponentMove = chooseOpponentMove(difficulty, history, opponent);
    setPending({ playerCardId: cardId, opponentCardId: opponentMove });
  }

  function resolveTiming(success) {
    if (paused || !pending) return;
    const outcome = applyMove({
      player,
      opponent,
      playerCardId: pending.playerCardId,
      opponentCardId: pending.opponentCardId,
      timingSuccess: success,
      save
    });

    setPlayer(outcome.player);
    setOpponent(outcome.opponent);
    setHistory((items) => [...items.slice(-4), pending.playerCardId]);
    setBanner(outcome.message);
    setPending(null);
  }

  function advanceRound() {
    if (round >= MAX_ROUNDS) {
      finishMatch(player, opponent);
      return;
    }
    setRound((value) => value + 1);
    setTime(ROUND_SECONDS);
    setBanner(`Raunt ${round + 1}`);
    setPlayer((value) => ({ ...value, energy: Math.min(110, value.energy + 18), denge: Math.min(120, value.denge + 6) }));
    setOpponent((value) => ({ ...value, energy: Math.min(110, value.energy + 14), denge: Math.min(120, value.denge + 5) }));
  }

  function finishMatch(finalPlayer = player, finalOpponent = opponent) {
    const won = finalPlayer.skor >= finalOpponent.skor;
    const rewards = getRewards(won);
    const matchResult = {
      won,
      rewards,
      playerScore: finalPlayer.skor,
      opponentScore: finalOpponent.skor
    };
    setResult(matchResult);
    onFinish(matchResult);
  }

  const disabled = Boolean(paused || pending || result);

  return (
    <main className={`match-screen${paused ? ' is-paused' : ''}`}>
      <header className="match-topbar">
        <button className="small-button" onClick={onExit}>Menu</button>
        <div><span>Raunt</span><strong>{round}/{MAX_ROUNDS}</strong></div>
        <div><span>Sure</span><strong>{time}</strong></div>
        <div><span>Skor</span><strong>{player.skor} - {opponent.skor}</strong></div>
      </header>

      <section className="arena">
        <div className="crowd" aria-hidden="true" />
        <Fighter side="left" name={wrestler.name} stats={player} />
        <div className="field-mark">
          <span>Er Meydani</span>
          <small>Rakip durusu: {getCard(stance).name}</small>
        </div>
        <Fighter side="right" name={opponent.name} stats={opponent} />
      </section>

      <section className="move-log">
        <div><span>Senin hamlen</span><strong>{pending ? getCard(pending.playerCardId).name : 'Secim bekleniyor'}</strong></div>
        <div><span>Rakip</span><strong>{pending ? getCard(pending.opponentCardId).name : difficulty}</strong></div>
      </section>

      <section className="card-dock" aria-label="Hamle kartlari">
        {ACTION_CARDS.map((card) => (
          <ActionCard key={card.id} card={card} disabled={disabled} onSelect={selectCard} />
        ))}
      </section>

      {pending && <TimingBar windowSize={timingWindow} paused={paused} onResolve={resolveTiming} />}
      {banner && <div className="round-banner">{banner}</div>}
      {result && <ResultModal result={result} onMenu={onExit} onAgain={onAgain} />}
      {paused && (
        <div className="pause-overlay" role="status" aria-live="polite">
          <strong>Duraklatıldı</strong>
          <span>Devam etmek için Esc veya P</span>
        </div>
      )}
    </main>
  );
}

function Fighter({ side, name, stats }) {
  return (
    <article className={`fighter fighter-${side}`}>
      <div className="fighter-body"><span /></div>
      <h2>{name}</h2>
      <div className="meters">
        <Meter label="Enerji" value={stats.energy} />
        <Meter label="Denge" value={stats.denge} />
      </div>
    </article>
  );
}

function Meter({ label, value }) {
  return (
    <label className="meter">
      <span>{label}</span>
      <b>{Math.round(value)}</b>
      <i><em style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
    </label>
  );
}
