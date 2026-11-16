import React from 'react';
import { BookOpen, Play, Trophy, Wrench } from 'lucide-react';

export default function Menu({ save, onStart, onUpgrade, onHowTo }) {
  return (
    <main className="menu-screen">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Geleneksel spor ruhu</p>
          <h1>Er Meydani</h1>
          <p>Kart sec, dogru ani yakala, ustalikla puan kazan.</p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" data-testid="start-game" onClick={onStart}><Play size={18} /> Maca Basla</button>
          <button className="ghost-button" data-testid="open-upgrades" onClick={onUpgrade}><Wrench size={18} /> Gelistir</button>
          <button className="ghost-button" data-testid="open-howto" onClick={onHowTo}><BookOpen size={18} /> Nasil Oynanir</button>
        </div>
      </section>

      <section className="save-strip" aria-label="Kayit bilgileri">
        <div><span>Altin</span><strong>{save.altin}</strong></div>
        <div><span>XP</span><strong>{save.xp}</strong></div>
        <div><span>Galibiyet</span><strong>{save.toplamGalibiyet}</strong></div>
        <div><span>Maglubiyet</span><strong>{save.toplamMaglubiyet}</strong></div>
        <div><span>Guc</span><strong>{save.gucSeviyesi}</strong></div>
        <div><span>Denge</span><strong>{save.dengeSeviyesi}</strong></div>
        <div><span>Dayaniklilik</span><strong>{save.dayaniklilikSeviyesi}</strong></div>
        <div><span>Teknik</span><strong>{save.teknikSeviyesi}</strong></div>
      </section>

      <section className="tone-band">
        <Trophy size={20} />
        <p>Saygi, denge ve zamanlama. Kan yok, kaba siddet yok; er meydaninda puan ve ustalik var.</p>
      </section>
    </main>
  );
}
