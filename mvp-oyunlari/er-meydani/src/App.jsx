import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Menu from './components/Menu';
import MatchScreen from './components/MatchScreen';
import WrestlerCard from './components/WrestlerCard';
import { WRESTLERS } from './logic/matchSystem';
import { getUpgradeCost, upgradeStat } from './logic/upgradeSystem';
import { loadSave, resetSave, saveGame } from './storage/storage';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [save, setSave] = useState(() => loadSave());
  const [selectedWrestler, setSelectedWrestler] = useState(WRESTLERS[0]);
  const [difficulty, setDifficulty] = useState('medium');
  const [matchKey, setMatchKey] = useState(0);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  function persist(nextSave) {
    setSave(nextSave);
    saveGame(nextSave);
  }

  function handleMatchFinish(result) {
    const nextSave = {
      ...save,
      altin: save.altin + result.rewards.altin,
      xp: save.xp + result.rewards.xp,
      toplamGalibiyet: save.toplamGalibiyet + (result.won ? 1 : 0),
      toplamMaglubiyet: save.toplamMaglubiyet + (result.won ? 0 : 1)
    };
    persist(nextSave);
  }

  function buyUpgrade(stat) {
    const outcome = upgradeStat(save, stat);
    setUpgradeMessage(outcome.message);
    if (outcome.success) persist(outcome.save);
  }

  function startMatch() {
    setMatchKey((value) => value + 1);
    setScreen('match');
  }

  if (screen === 'select') {
    return (
      <Shell title="Pehlivan Secimi" onBack={() => setScreen('menu')}>
        <section className="select-layout">
          <div className="wrestler-list">
            {WRESTLERS.map((wrestler) => (
              <WrestlerCard
                key={wrestler.id}
                wrestler={wrestler}
                selected={selectedWrestler.id === wrestler.id}
                onSelect={setSelectedWrestler}
              />
            ))}
          </div>
          <div className="difficulty-box">
            <h2>Rakip Seviyesi</h2>
            <div className="segmented">
              {['easy', 'medium', 'hard'].map((item) => (
                <button key={item} className={difficulty === item ? 'active' : ''} onClick={() => setDifficulty(item)}>
                  {item === 'easy' ? 'Kolay' : item === 'medium' ? 'Orta' : 'Zor'}
                </button>
              ))}
            </div>
            <button className="primary-button wide" data-testid="enter-match" onClick={startMatch}>Meydana Cik</button>
          </div>
        </section>
      </Shell>
    );
  }

  if (screen === 'match') {
    return (
      <MatchScreen
        key={matchKey}
        save={save}
        wrestler={selectedWrestler}
        difficulty={difficulty}
        onFinish={handleMatchFinish}
        onAgain={startMatch}
        onExit={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'upgrades') {
    const upgrades = [
      ['guc', 'Guc', save.gucSeviyesi, 'Basarili hamlede daha fazla puan.'],
      ['denge', 'Denge', save.dengeSeviyesi, 'Rakip hamlesinden daha az etkilenme.'],
      ['dayaniklilik', 'Dayaniklilik', save.dayaniklilikSeviyesi, 'Enerji daha yavas azalir.'],
      ['teknik', 'Teknik', save.teknikSeviyesi, 'Timing basari alani genisler.']
    ];

    return (
      <Shell title="Gelistirme" onBack={() => setScreen('menu')}>
        <section className="upgrade-screen">
          <div className="wallet"><span>Altin</span><strong>{save.altin}</strong></div>
          <div className="upgrade-grid">
            {upgrades.map(([id, label, level, desc]) => (
              <article className="upgrade-item" key={id}>
                <h2>{label}</h2>
                <p>{desc}</p>
                <div><span>Seviye {level}</span><strong>{getUpgradeCost(level)} altin</strong></div>
                <button className="primary-button" onClick={() => buyUpgrade(id)}>Gelistir</button>
              </article>
            ))}
          </div>
          {upgradeMessage && <p className="notice">{upgradeMessage}</p>}
          <button
            className="ghost-button reset-button"
            onClick={() => {
              const fresh = resetSave();
              setSave(fresh);
              setUpgradeMessage('Kayit sifirlandi.');
            }}
          >
            <RotateCcw size={17} /> Kaydi Sifirla
          </button>
        </section>
      </Shell>
    );
  }

  if (screen === 'howto') {
    return (
      <Shell title="Nasil Oynanir" onBack={() => setScreen('menu')}>
        <section className="howto">
          <article>
            <h2>Mac Akisi</h2>
            <p>Her mac 3 raunttur. Kart secildikten sonra timing bar acilir; isaret yesil alandayken tikla veya dokun.</p>
          </article>
          <article>
            <h2>Kart Mantigi</h2>
            <p>Kavrama, Denge Bozma'ya; Celme, Kavrama'ya; Savunma, Celme'ye karsi gucludur. Karsi Hamle agresif secimleri yakalar. Dayan enerji kazandirir.</p>
          </article>
          <article>
            <h2>Gelistirme</h2>
            <p>Mac sonunda altin ve XP kazanirsin. Altinla guc, denge, dayaniklilik ve teknik seviyelerini artirabilirsin.</p>
          </article>
        </section>
      </Shell>
    );
  }

  return <Menu save={save} onStart={() => setScreen('select')} onUpgrade={() => setScreen('upgrades')} onHowTo={() => setScreen('howto')} />;
}

function Shell({ title, onBack, children }) {
  return (
    <main className="shell">
      <header className="shell-header">
        <button className="small-button" onClick={onBack}><ArrowLeft size={18} /> Geri</button>
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  );
}
