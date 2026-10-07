'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { oyunuBaslat } from '@/lib/oyun-motoru';
import GluonaSor from './GluonaSor';

const c = renk => ({ '--c': `var(--${renk})` });

export default function Oyun({ baslangicYildiz = 0, ad, kota }) {
  const router = useRouter();

  useEffect(() => {
    // Biten her görev ve oyun, yıldızlarıyla birlikte veritabanına kaydedilir.
    const kaydet = async kayit => {
      const cevap = await fetch('/api/ilerleme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kayit)
      }).catch(() => null);
      if (cevap && cevap.status === 401) router.replace('/?yonlendirme=1');
    };
    const durdur = oyunuBaslat({ baslangicYildiz, kaydet });
    return durdur;
    // Oyun yalnızca bir kez kurulur; motor DOM'u kendisi yönetir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="oyun">
      <div className="oyun-ust">
        <nav className="tabs" role="tablist" aria-label="Oyun bölümleri">
          <button type="button" className="tab" role="tab" id="t-kesfet" data-tab="kesfet" aria-controls="p-kesfet" style={c('electron')}>Atomu keşfet</button>
          <button type="button" className="tab" role="tab" id="t-kur" data-tab="kur" aria-controls="p-kur" style={c('proton')}>Atom kur</button>
          <button type="button" className="tab" role="tab" id="t-foton" data-tab="foton" aria-controls="p-foton" style={c('photon')}>Foton yakala</button>
          <button type="button" className="tab" role="tab" id="t-quiz" data-tab="quiz" aria-controls="p-quiz" style={c('quark')}>Bilgi yarışması</button>
          <button type="button" className="tab" role="tab" id="t-sor" data-tab="sor" aria-controls="p-sor" style={c('gluon')}>Gluon Dede&apos;ye sor</button>
        </nav>
        <div className="hud">
          <div className="stars" id="stars" aria-live="polite">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" fill="#FFD23F" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" /></svg>
            <span id="starCount">{baslangicYildiz}</span><span className="sr">yıldız</span>
          </div>
          <button type="button" className="icon-btn" id="soundBtn" aria-pressed="true" aria-label="Sesi kapat">🔊</button>
        </div>
      </div>

      {/* 1. Atomu keşfet */}
      <section className="panel" id="p-kesfet" role="tabpanel" aria-labelledby="t-kesfet">
        <div>
          <div className="stage">
            <canvas id="cv-kesfet" role="img" aria-label="Hareketli bir lityum atomu. Parçacıklara dokunarak aile üyeleriyle tanışabilirsin." />
            <button type="button" className="btn ghost back" id="backBtn" hidden>Atoma dön</button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn" id="quantumBtn" aria-pressed="false">Kuantum gözlüğünü tak</button>
            <button type="button" className="btn red" id="insideP">Protonun içi</button>
            <button type="button" className="btn blue" id="insideN">Nötronun içi</button>
          </div>
          <p className="caption" id="kCaption" aria-live="polite" />
        </div>
        <div className="side">
          <div className="card char-card" id="charCard" aria-live="polite">
            <div className="char-head">
              <canvas id="portrait" width="84" height="84" aria-hidden="true" />
              <div>
                <h2 id="charName">Atom Ailesi</h2>
                <p className="role" id="charRole">Bir aile üyesine dokun</p>
              </div>
            </div>
            <p id="charText" />
            <p className="fact" id="charFact" />
          </div>
          <div className="card">
            <h3>Aile üyeleri</h3>
            <div className="chips" id="chips" />
          </div>
        </div>
      </section>

      {/* 2. Atom kur */}
      <section className="panel" id="p-kur" role="tabpanel" aria-labelledby="t-kur" hidden>
        <div>
          <div className="stage">
            <canvas id="cv-kur" role="img" aria-label="Senin kurduğun atom" />
            <div className="tile" aria-live="polite"><span className="z" id="tZ">0</span><span className="sym" id="tSym">?</span><span className="nm" id="tName">Boş ev</span></div>
          </div>
          <span className="charge" id="charge" aria-live="polite" />
        </div>
        <div className="side">
          <div className="card">
            <p className="level" id="mLevel" />
            <h2 id="mTitle" />
            <p id="mText" />
            <div className="btn-row">
              <button type="button" className="btn green" id="checkBtn">Kontrol et</button>
              <button type="button" className="btn ghost" id="hintBtn">İpucu</button>
              <button type="button" className="btn" id="nextBtn" hidden>Sonraki görev</button>
            </div>
            <p className="feedback" id="mFeedback" aria-live="polite" />
          </div>
          <div className="card">
            <div className="counter">
              <span className="ball" style={c('proton')} />
              <div><strong>Anne Proton</strong><small>Yük: artı (+)</small></div>
              <button type="button" className="step" style={c('proton')} data-type="p" data-d="-1" aria-label="Proton çıkar">−</button>
              <output id="cP">0</output>
              <button type="button" className="step" style={c('proton')} data-type="p" data-d="1" aria-label="Proton ekle">+</button>
            </div>
            <div className="counter">
              <span className="ball" style={c('neutron')} />
              <div><strong>Baba Nötron</strong><small>Yük: yok (0)</small></div>
              <button type="button" className="step" style={c('neutron')} data-type="n" data-d="-1" aria-label="Nötron çıkar">−</button>
              <output id="cN">0</output>
              <button type="button" className="step" style={c('neutron')} data-type="n" data-d="1" aria-label="Nötron ekle">+</button>
            </div>
            <div className="counter">
              <span className="ball" style={c('electron')} />
              <div><strong>Elektron Kardeş</strong><small>Yük: eksi (−)</small></div>
              <button type="button" className="step" style={c('electron')} data-type="e" data-d="-1" aria-label="Elektron çıkar">−</button>
              <output id="cE">0</output>
              <button type="button" className="step" style={c('electron')} data-type="e" data-d="1" aria-label="Elektron ekle">+</button>
            </div>
            <div className="btn-row"><button type="button" className="btn ghost" id="clearBtn">Evi boşalt</button></div>
          </div>
        </div>
      </section>

      {/* 3. Foton yakala */}
      <section className="panel" id="p-foton" role="tabpanel" aria-labelledby="t-foton" hidden>
        <div>
          <div className="stage">
            <canvas id="cv-foton" role="img" aria-label="Foton yakalama oyunu. Soldan gelen fotonlara dokun." />
          </div>
          <p className="caption" id="fCaption" aria-live="polite" />
        </div>
        <div className="side">
          <div className="card">
            <h2>Foton yakala</h2>
            <p>Foton Postacılar soldan geliyor. Minik Elektron&apos;un üst kata zıplaması için doğru renkteki fotona dokun!</p>
            <div className="scoreboard">
              <div><span className="lbl">Süre</span><span className="big" id="fTime">45</span></div>
              <div><span className="lbl">Puan</span><span className="big" id="fScore">0</span></div>
            </div>
            <div className="btn-row"><button type="button" className="btn cyan" id="fStart">Oyunu başlat</button></div>
            <p className="feedback" id="fFeedback" aria-live="polite" />
          </div>
          <div className="card legend">
            <div><span className="swatch" style={c('photon')} />Camgöbeği foton: 2. kata zıplatır, 1 puan</div>
            <div><span className="swatch" style={c('violet')} />Mor foton: 3. kata zıplatır, 2 puan</div>
            <div><span className="swatch" style={{ '--c': '#FF9F43' }} /><span className="swatch" style={{ '--c': '#FF7AC6', marginLeft: -6 }} />Turuncu ve pembe: elektron bunları almaz</div>
          </div>
          <div className="card">
            <p className="fact" style={{ margin: 0 }}>Neden sadece bazı renkler? Fotonun rengi taşıdığı enerjiyi gösterir. Elektron yalnızca iki kat arasındaki farka tam uyan enerjiyi alabilir. Buna kuantum mekaniği diyoruz!</p>
          </div>
        </div>
      </section>

      {/* 4. Bilgi yarışması */}
      <section className="panel single" id="p-quiz" role="tabpanel" aria-labelledby="t-quiz" hidden>
        <div className="card">
          <p className="level" id="qLevel" />
          <div className="progress" id="qProgress" aria-hidden="true" />
          <p className="q" id="qText" />
          <div className="opts" id="qOpts" />
          <p className="feedback exp" id="qExp" aria-live="polite" />
          <div className="btn-row"><button type="button" className="btn green" id="qNext" hidden>Sonraki soru</button></div>
        </div>
      </section>

      {/* 5. Gluon Dede'ye sor (yapay zekâ asistanı) */}
      <section className="panel" id="p-sor" role="tabpanel" aria-labelledby="t-sor" hidden>
        <GluonaSor ad={ad} kota={kota} />
      </section>

      <canvas id="confetti" aria-hidden="true" />
    </div>
  );
}
