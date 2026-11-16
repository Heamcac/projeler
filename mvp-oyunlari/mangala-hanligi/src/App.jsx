import { useMemo, useState } from 'react';
import MenuPage from './pages/MenuPage.jsx';
import GamePage from './pages/GamePage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [difficulty, setDifficulty] = useState('orta');
  const [result, setResult] = useState(null);
  const nav = useMemo(
    () => ({
      menu: () => setScreen('menu'),
      rules: () => setScreen('rules'),
      stats: () => setScreen('stats'),
      game: () => setScreen('game'),
      result: (gameResult) => {
        setResult(gameResult);
        setScreen('result');
      },
    }),
    [],
  );

  if (screen === 'game') {
    return <GamePage difficulty={difficulty} onResult={nav.result} onBack={nav.menu} />;
  }

  if (screen === 'rules') return <RulesPage onBack={nav.menu} onPlay={nav.game} />;
  if (screen === 'stats') return <StatsPage onBack={nav.menu} />;
  if (screen === 'result') return <ResultPage result={result} onMenu={nav.menu} onStats={nav.stats} onPlayAgain={nav.game} />;

  return (
    <MenuPage
      difficulty={difficulty}
      onDifficulty={setDifficulty}
      onStart={nav.game}
      onRules={nav.rules}
      onStats={nav.stats}
    />
  );
}
