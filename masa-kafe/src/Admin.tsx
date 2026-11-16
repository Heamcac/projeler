import { useState } from 'react'
import { local, money, t, type Key, type Lang } from './i18n'
import { categories, type Campaign, type Category, type Data, type Product, type Settings } from './mock/mockApi'
import type { Run } from './Operations'
import { Dialog, Field, Icon, SectionTitle, Stat } from './ui'

export function Admin({ lang, d, run }: { lang: Lang; d: Data; run: Run }) {
  const [view, setView] = useState<'menu' | 'settings' | 'loyalty' | 'qr' | 'reports' | 'logs'>('menu')
  const [selected, select] = useState(1)
  const [table, setTable] = useState(1)
  const [pdf, setPdf] = useState(false)
  const tr = (key: Key) => t(lang,key)
  const activity = [
    { label:'dayOrders', count:d.activities.filter(entry => entry.key === 'sent').length + 5 },
    { label:'delivered', count:d.activities.filter(entry => entry.key === 'delivered').length + 2 },
    { label:'closedBills', count:d.activities.filter(entry => entry.key === 'closeBill').length },
    { label:'cleaned', count:d.activities.filter(entry => entry.key === 'cleaned').length },
  ] as const
  return <>
    <SectionTitle eyebrow={tr('venue')} title={tr('admin')} detail={tr('settings') + ' · ' + tr('reports')}/>
    <div className="subtabs">{(['menu','settings','loyalty','qr','reports','logs'] as const).map(key => <button key={key} className={view === key ? 'selected' : ''} aria-pressed={view === key} onClick={() => setView(key)}>{tr(key)}</button>)}</div>
    {view === 'menu' && <section className="surface stack">
      <div className="surface-title"><h2>{tr('menu')}</h2><span className="count">{d.menu.length}</span></div>
      <Field title={tr('menu')}><select value={selected} onChange={event => select(Number(event.target.value))}>{d.menu.map(item => <option value={item.id} key={item.id}>{local(item.title,lang)} · {money(item.price,lang)}</option>)}</select></Field>
      <MenuForm key={selected} product={d.menu[selected-1]} {...{lang,run}}/>
    </section>}
    {view === 'settings' && <SettingsForm settings={d.settings} {...{lang,run}}/>}
    {view === 'loyalty' && <CampaignForm campaign={d.campaign} {...{lang,run}}/>}
    {view === 'qr' && <section className="surface stack">
      <div className="surface-title"><h2>{tr('qr')}</h2><span className="count">{d.tables.length}</span></div>
      <div className="qr-preview"><Qr id={table}/><div className="stack">
        <Field title={tr('table')}><select value={table} onChange={event => setTable(Number(event.target.value))}>{d.tables.map(item => <option value={item.id} key={item.id}>{tr('table')} {item.id}</option>)}</select></Field>
        <p>{tr('sampleQr')}</p><button onClick={() => { setPdf(true); run({type:'track',key:'pdf'}) }}><Icon name="layers" size={16}/>{tr('pdf')}</button>
      </div></div>
      {pdf && <Dialog title={tr('pdf')} onClose={() => setPdf(false)}><p>{tr('sampleQr')}</p><div className="qr-sheet">{d.tables.map(item => <div key={item.id}><Qr id={item.id}/><b>{tr('table')} {item.id}</b></div>)}</div></Dialog>}
    </section>}
    {view === 'reports' && <div className="stack"><div className="stats three">
      <Stat icon="receipt" label={tr('sales')} value={money(d.payments.reduce((sum,payment) => sum + payment.value, 0),lang)}/>
      <Stat icon="check" label={tr('closedBills')} value={activity[2].count}/>
      <Stat icon="bag" label={tr('dayOrders')} value={activity[0].count}/>
    </div><section className="surface stack"><h2>{tr('activity')}</h2>
      {activity.map(item => <div className="bar-row" key={item.label}><span>{tr(item.label)}</span><div aria-hidden="true"><i style={{ width:(item.count / Math.max(...activity.map(row => row.count)) * 100) + '%' }}/></div><b>{item.count}</b></div>)}
    </section></div>}
    {view === 'logs' && <section className="surface stack"><div className="surface-title"><h2>{tr('logs')}</h2><span className="count">{d.activities.length}</span></div>
      <ol className="activity-log">{d.activities.map(entry => <li key={entry.id}><time>{new Intl.DateTimeFormat(lang,{timeStyle:'medium'}).format(entry.time)}</time><div><b>{tr(entry.key)}</b><small>{[entry.table === undefined ? undefined : tr('table') + ' ' + entry.table,entry.note].filter(Boolean).join(' · ')}</small></div></li>)}</ol>
    </section>}
  </>
}

function MenuForm({ product, lang, run }: { product: Product; lang: Lang; run: Run }) {
  const tr = (key: Key) => t(lang,key)
  return <form className="form-grid" onSubmit={event => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    run({type:'product',id:product.id,title:[String(data.get('tr')),String(data.get('en'))],price:Number(data.get('price'))})
  }}>
    <Field title={tr('translationTr')}><input name="tr" defaultValue={product.title[0]} required/></Field>
    <Field title={tr('translationEn')}><input name="en" defaultValue={product.title[1]} required/></Field>
    <Field title={tr('price')}><input name="price" defaultValue={product.price} type="number" min="0" step=".01" required/></Field>
    <button className="primary form-button">{tr('save')}</button>
  </form>
}

function SettingsForm({ settings, lang, run }: { settings: Settings; lang: Lang; run: Run }) {
  const tr = (key: Key) => t(lang,key)
  const numbers = [['verifySeconds',5,3600],['acceptSeconds',3,600],['limit',1,20],['waiterCount',1,4]] as const
  return <section className="surface stack"><h2>{tr('settings')}</h2>
    <form className="form-grid" onSubmit={event => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      const updated = { ...settings, cafe:String(data.get('cafe')).trim() }
      for (const [key] of numbers) updated[key] = Number(data.get(key))
      run({type:'settings',settings:updated})
    }}>
      <Field title={tr('nameCafe')}><input name="cafe" defaultValue={settings.cafe} placeholder={tr('brand')} maxLength={40}/></Field>
      {numbers.map(([key,min,max]) => <Field key={key} title={tr(key)}><input name={key} defaultValue={settings[key]} type="number" {...{min,max}} required/></Field>)}
      <button className="primary form-button">{tr('save')}</button>
    </form>
  </section>
}

function CampaignForm({ campaign, lang, run }: { campaign: Campaign; lang: Lang; run: Run }) {
  const tr = (key: Key) => t(lang,key)
  return <section className="surface stack"><div className="surface-title"><h2>{tr('campaign')}</h2><span className="chip">{tr('preview')}</span></div>
    <form className="form-grid" onSubmit={event => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      run({type:'campaign',campaign:{
        name:[String(data.get('nameTr')),String(data.get('nameEn'))],
        reward:[String(data.get('rewardTr')),String(data.get('rewardEn'))],
        scope:data.get('scope') as Category | 'all',target:Number(data.get('target')),enabled:data.has('enabled'),
      }})
    }}>
      {(['name','reward'] as const).flatMap(key => (['Tr','En'] as const).map((language,index) => <Field key={key + language} title={tr(key) + ' · ' + language.toUpperCase()}><input name={key + language} defaultValue={campaign[key][index]} required/></Field>))}
      <Field title={tr('scope')}><select name="scope" defaultValue={campaign.scope}><option value="all">{tr('all')}</option>
        {(Object.keys(categories) as Category[]).map(key => <option value={key} key={key}>{local(categories[key],lang)}</option>)}</select></Field>
      <Field title={tr('targetCount')}><input name="target" defaultValue={campaign.target} type="number" min="1" required/></Field>
      <label className="check-row"><input type="checkbox" defaultChecked={campaign.enabled} name="enabled"/>{tr('enabled')}</label>
      <button className="primary form-button">{tr('save')}</button>
    </form>
  </section>
}

function Qr({ id }: { id: number }) {
  const marks = Array.from({length:441},(_,index) => {
    const x = index % 21
    const y = Math.floor(index / 21)
    const corner = [[0,0],[14,0],[0,14]].find(([a,b]) => x >= a && x < a + 7 && y >= b && y < b + 7)
    if (corner) {
      const offset = Math.max(Math.abs(x-corner[0]-3),Math.abs(y-corner[1]-3))
      if (offset === 2) return null
    } else if ((x * y * 7 + x * 13 + y * 19 + id * (x + 3 * y + 5)) % 11 > 4) return null
    return <rect key={index} x={x + 2} y={y + 2} width={1} height={1}/>
  })
  return <svg className="qr" viewBox="0 0 25 25" aria-hidden="true"><rect width="25" height="25" fill="#fff"/>{marks}</svg>
}
