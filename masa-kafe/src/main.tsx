import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Admin } from './Admin'
import { Guest, type GuestView } from './Guest'
import { Cashier, Waiter, type Run, type WaiterView } from './Operations'
import { local, t, type Key, type Lang } from './i18n'
import { openTasks, useDemo } from './mock/mockApi'
import { scenarios, type Panel, type Scenario } from './scenarios'
import { Icon, type IconName } from './ui'
import './styles.css'

type Guide = { scenario: Scenario; index: number; auto: boolean }
const panelTabs: [Panel, IconName][] = [['waiter','users'],['cashier','receipt'],['admin','settings']]
const guideNames: Scenario[] = ['mainFlow','miniMove','miniStock']

function App() {
  const { data:d, act, tick, reset } = useDemo()
  const [lang, setLang] = useState<Lang>('tr')
  const [panel, setPanel] = useState<Panel>('waiter')
  const [guest, setGuest] = useState<GuestView>('menu')
  const [waiter, setWaiter] = useState<WaiterView>('overview')
  const [staff, setStaff] = useState(0)
  const [cashTable, setCashTable] = useState<number | null>(null)
  const [presentation, setPresentation] = useState(false)
  const [sound, setSound] = useState(true)
  const [picker, setPicker] = useState(false)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState<{ text:string; error:boolean; id:number } | null>(null)
  const audio = useRef<AudioContext | null>(null)
  const seenNotice = useRef<number | null>(null)
  const tr = (key: Key) => t(lang,key)
  const brand = d.settings.cafe || tr('brand')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = 'ltr'
    document.title = brand + ' · Demo'
  },[brand,lang])
  useEffect(() => {
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  },[tick])
  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(null),4200)
    return () => window.clearTimeout(timeout)
  },[message])
  useEffect(() => {
    const notice = d.notice
    if (!notice || seenNotice.current === notice.id) return
    seenNotice.current = notice.id
    setMessage({text:t(lang,notice.key) + (notice.table ? ' · ' + t(lang,'table') + ' ' + notice.table : ''), error:false, id:notice.id})
    const context = audio.current
    if (sound && context?.state === 'running') {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(560,context.currentTime)
      oscillator.frequency.setValueAtTime(740,context.currentTime + .07)
      gain.gain.setValueAtTime(.035,context.currentTime)
      gain.gain.exponentialRampToValueAtTime(.001,context.currentTime + .24)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + .25)
    }
  },[d.notice,lang,sound])

  const run = useCallback<Run>(action => {
    const error = act(action)
    if (error) {
      const label = t(lang,error)
      setMessage({text:label,error:true,id:Date.now()})
      window.dispatchEvent(new CustomEvent('demo-error',{detail:label}))
      return false
    }
    return true
  },[act,lang])

  function unlockAudio() {
    if (!sound || audio.current?.state === 'running' || !window.AudioContext) return
    audio.current ??= new AudioContext()
    void audio.current.resume().catch(() => {})
  }

  function changeLanguage(value: Lang) {
    setLang(value)
    run({type:'track',key:'language'})
  }

  function resetWorkspace() {
    reset()
    setRevision(value => value + 1)
    setGuide(null)
    setPicker(false)
    setGuest('menu')
    setWaiter('overview')
    setPanel('waiter')
    setStaff(0)
    setCashTable(null)
    setMessage(null)
    seenNotice.current = null
  }

  function start(scenario: Scenario) {
    resetWorkspace()
    setGuide({scenario,index:0,auto:false})
    run({type:'track',key:scenario})
  }

  const currentSteps = guide ? scenarios[guide.scenario] : undefined
  const step = guide && currentSteps?.[guide.index]
  const advance = useCallback(() => {
    if (!step || !guide) return
    const successful = step.perform({d:useDemo.getState().data,run,panel:setPanel,guest:setGuest,waiter:setWaiter,staff:setStaff})
    setGuide(current => current === guide ? { ...current, index:current.index + Number(successful), auto:successful && current.auto } : current)
  },[guide,run,step])
  useEffect(() => {
    if (!step || !guide || !step.done?.(d)) return
    if (guide.scenario === 'mainFlow') {
      if (guide.index === 3) { setPanel('waiter'); setWaiter('orders') }
      if (guide.index === 8) setPanel('cashier')
      if (guide.index === 9) {
        setPanel('waiter')
        setWaiter('overview')
        const cleaning = openTasks(d).find(task => task.table === 7 && task.type === 'cleanCall')
        if (cleaning?.assignee !== undefined) setStaff(cleaning.assignee)
      }
    }
    setGuide(current => current === guide ? {...current,index:current.index + 1} : current)
  },[d,guide,step])
  useEffect(() => {
    if (!guide?.auto || !step) return
    const timeout = window.setTimeout(advance,3000)
    return () => window.clearTimeout(timeout)
  },[advance,guide?.auto,step])
  return <div className={'app' + (presentation ? ' presentation' : '')} onPointerDownCapture={unlockAudio}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Icon name="coffee" size={24}/></div><div><strong>{brand}</strong><small>{tr('workspace')}</small></div></div>
      <span className="demo-label"><i/>{tr('demo')}</span>
      <div className="top-controls">
        <div className="lang-switch" aria-label={tr('language')}>{(['tr','en'] as const).map(value => <button key={value} aria-pressed={lang === value} className={lang === value ? 'selected' : ''} onClick={() => changeLanguage(value)}>{value.toUpperCase()}</button>)}</div>
        <button className="icon-button sound-button" aria-label={tr('sound')} title={tr('sound')} aria-pressed={sound} onClick={() => setSound(!sound)}><Icon name={sound ? 'sound' : 'muted'} size={18}/></button>
        <button className="reset-button" onClick={() => { resetWorkspace(); setLang('tr'); setPresentation(false); setSound(true) }}><Icon name="reset" size={16}/><span>{tr('reset')}</span></button>
        <button className="presentation-button" aria-pressed={presentation} onClick={() => {setPresentation(!presentation); if (!presentation) setSound(false); run({type:'track',key:'presentation'})}}><Icon name="expand" size={16}/><span>{tr('presentation')}</span></button>
      </div>
    </header>
    <main className="workspace" key={revision}>
      <Guest lang={lang} setLang={changeLanguage} brand={brand} view={guest} setView={setGuest} run={run}/>
      <section className="ops-pane" aria-label={tr('operation')}>
        <div className="pane-label"><span className="pane-icon"><Icon name="monitor" size={16}/></span><strong>{tr('operation')}</strong><span className="live"><i/>{tr('live')}</span></div>
        <div className="ops-toolbar">
          <nav className="panel-tabs" aria-label={tr('nav')}>{panelTabs.map(([key,icon]) => <button key={key} aria-current={panel === key ? 'page' : undefined} onClick={() => {setPanel(key); setCashTable(null)}}><Icon name={icon} size={17}/>{tr(key)}</button>)}</nav>
          <div className="guide-control">
            <button className="primary guide-launch" onClick={() => setPicker(!picker)} aria-expanded={picker}><Icon name="play" size={15}/>{tr('scenario')}</button>
            {picker && <div className="guide-picker"><div className="eyebrow">{tr('guidePicker')}</div>
              {guideNames.map(key => <button key={key} onClick={() => start(key)}>{tr(key)}<Icon name="arrow" size={15}/></button>)}</div>}
          </div>
        </div>
        {guide && <div className="guide-banner" role="region" aria-label={tr('guided')}>
          <span className="guide-icon"><Icon name="spark" size={18}/></span>
          <div className="guide-copy"><div className="eyebrow">{tr(guide.scenario)}{step && ' · ' + tr('step') + ' ' + (guide.index + 1) + '/' + currentSteps!.length}</div>
            <p aria-live="polite">{step ? local(step.hint,lang) : tr('finish')}</p></div>
          <div className="guide-buttons">
            {step ? <><button onClick={() => setGuide({...guide,auto:!guide.auto})}>{tr(guide.auto ? 'pause' : 'auto')}</button>
              <button className="quiet-accent" onClick={advance} disabled={guide.auto}>{tr('doStep')}<Icon name="arrow" size={15}/></button></> :
              <button onClick={() => start(guide.scenario)}>{tr('retry')}</button>}
            <button className="icon-button" onClick={() => setGuide(null)} aria-label={tr('close')}><Icon name="close" size={16}/></button>
          </div>
        </div>}
        <div className="ops-content">
          {panel === 'waiter' && <Waiter lang={lang} d={d} run={run} staff={staff} setStaff={setStaff} view={waiter} setView={setWaiter}/>}
          {panel === 'cashier' && <Cashier lang={lang} d={d} run={run} selected={cashTable} setSelected={setCashTable}/>}
          {panel === 'admin' && <Admin lang={lang} d={d} run={run}/>}
        </div>
      </section>
    </main>
    {message && <div key={message.id} className={'toast' + (message.error ? ' error' : '')} role={message.error ? 'alert' : 'status'}><span><Icon name={message.error ? 'bell' : 'check'} size={16}/></span>{message.text}<button className="icon-button" onClick={() => setMessage(null)} aria-label={tr('close')}><Icon name="close" size={15}/></button></div>}
  </div>
}

createRoot(document.getElementById('root')!).render(<App/>)
