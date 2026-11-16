import { useEffect, useState, type FormEvent } from 'react'
import { local, money, t, type Key, type Lang } from './i18n'
import { allergenNames, billFor, categories, ordersFor, tableAt, useDemo, type Category, type Product } from './mock/mockApi'
import { CoffeeArt, Dialog, Field, Icon, LineItems, ProductArt } from './ui'

export type GuestView = 'menu' | 'cart' | 'orders' | 'bill'
type Request = 'call' | 'billCall' | 'cleanCall'
type Run = (action: Parameters<ReturnType<typeof useDemo.getState>['act']>[0]) => boolean

export function Guest({ lang, setLang, brand, view, setView, run }: { lang: Lang; setLang: (value: Lang) => void; brand: string; view: GuestView; setView: (value: GuestView) => void; run: Run }) {
  const d = useDemo(state => state.data)
  const [selected, select] = useState(7)
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')
  const [product, setProduct] = useState<number | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [register, setRegister] = useState<'register' | 'sms' | null>(null)
  const [smsError, setSmsError] = useState(false)
  const [access, setAccess] = useState(false)
  const [large, setLarge] = useState(false)
  const [high, setHigh] = useState(false)
  const [hideCode, setHideCode] = useState(false)
  const tr = (key: Key) => t(lang, key)
  const table = d.guest === null ? undefined : tableAt(d, d.guest)
  const verified = table?.status === 'active' || table?.status === 'billRequested' || table?.status === 'merged'
  const warning = d.cart.some(line => d.menu[line.product-1]?.sold)
  const visible = d.menu.filter(item => !item.sold && (category === 'all' || category === item.category)
    && local(item.title, lang).toLocaleLowerCase(lang).includes(search.toLocaleLowerCase(lang)))
  const freeTables = d.tables.filter(item => item.status === 'free')
  const pick = freeTables.some(item => item.id === selected) ? selected : freeTables[0]?.id
  const item = d.menu.find(p => p.id === product)
  const tabs: [GuestView, 'coffee' | 'cart' | 'receipt' | 'package'][] = [
    ['menu','coffee'], ['cart','cart'], ['orders','package'], ['bill','receipt'],
  ]
  const guestOrders = table ? ordersFor(d, table.id) : []
  const loyalty = Math.min(d.campaign.target, 3 + guestOrders.filter(o => o.status === 'delivered').flatMap(o => o.lines)
    .filter(line => d.campaign.scope === 'all' || d.menu[line.product-1].category === d.campaign.scope).length)
  useEffect(() => {
    if (!table) {
      setHideCode(false)
      setView('menu')
    }
  }, [table, setView])

  return <section className="guest-pane" aria-label={tr('guest')}>
    <div className="pane-label"><span className="pane-icon"><Icon name="phone" size={16}/></span><strong>{tr('guest')}</strong><span className="pane-index">01 / QR</span></div>
    <div className={'device' + (large ? ' large-text' : '') + (high ? ' high-contrast' : '')}>
      <div className="device-status" aria-hidden="true"><span>9:41</span><i/><span>▂▃▅ ▰</span></div>
      <div className="phone-brand">
        <div className="phone-brand-title"><span><Icon name="coffee" size={17}/></span><b>{brand}</b></div>
        <button className="icon-button text-size" aria-label={tr('language') + ' / ' + tr('larger') + ' / ' + tr('contrast')} onClick={() => setAccess(!access)} aria-expanded={access}>Aa</button>
      </div>
      {access && <div className="phone-access">
        <Field title={tr('language')}><select value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="tr">TR</option><option value="en">EN</option></select></Field>
        <label><input type="checkbox" checked={large} onChange={e => setLarge(e.target.checked)}/>{tr('larger')}</label>
        <label><input type="checkbox" checked={high} onChange={e => setHigh(e.target.checked)}/>{tr('contrast')}</label>
      </div>}
      <div className="phone-scroll" key={view + String(!!table) + String(register)}>
        {!table && !register && <div className="phone-welcome">
          <div className="phone-hero"><CoffeeArt/><div className="hero-label"><span>✦</span> {tr('qrSim')}</div></div>
          <div className="welcome-copy"><h2>{tr('welcome')}</h2><p>{tr('welcomeSub')}</p></div>
          <div className="scan-form">
            <Field title={tr('choose')}><select value={pick ?? ''} onChange={e => select(Number(e.target.value))}>
              {freeTables.map(item => <option value={item.id} key={item.id}>{tr('table')} {String(item.id).padStart(2, '0')}</option>)}
            </select></Field>
            <button className="primary scan-button" disabled={pick === undefined} onClick={() => { if (pick !== undefined) run({ type:'scan', table:pick }) }}><Icon name="qr" size={17}/>{tr('scan')}<Icon name="arrow" size={16}/></button>
          </div>
          <button className="preview-link" onClick={() => { setRegister('register'); run({type:'track', key:'register'}) }}>{tr('register')} <span className="chip">{tr('preview')}</span></button>
        </div>}
        {register === 'register' && <form className="phone-section stack" onSubmit={event => {
          event.preventDefault()
          setRegister('sms')
          run({type:'track', key:'sms'})
        }}>
          <span className="chip">{tr('preview')}</span><h2>{tr('register')}</h2><p>{tr('fictional')}</p>
          <Field title={tr('name')}><input value={tr('seededGuest')} readOnly/></Field>
          <Field title={tr('phone')}><input value="••• ••• •• ••" readOnly/></Field>
          <label className="check-row"><input type="checkbox" required/>{tr('consent')}</label>
          <button className="primary">{tr('next')}</button><button type="button" onClick={() => setRegister(null)}>{tr('skip')}</button>
        </form>}
        {register === 'sms' && <form className="phone-section stack" onSubmit={event => {
          event.preventDefault()
          if (new FormData(event.currentTarget).get('code') !== '123456') { setSmsError(true); return }
          setSmsError(false)
          setRegister(null)
          run({type:'track', key:'confirm'})
        }}>
          <span className="chip">{tr('preview')}</span><h2>{tr('sms')}</h2><p>{tr('smsHint')}</p>
          <Field title={tr('sms')}><input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required/></Field>
          {smsError && <div className="warning" role="alert">{tr('badCode')}</div>}
          <button className="primary">{tr('confirm')}</button><button type="button" onClick={() => { setSmsError(false); setRegister(null) }}>{tr('skip')}</button>
        </form>}
        {table && !register && <>
          <div className="phone-table"><span className="chip"><Icon name="grid" size={13}/>{tr('table')} {table.id}</span>
            <button className="text-button" onClick={() => run({type:'leave'})}>{tr('changeTable')}</button></div>
          {view === 'menu' && <div className="phone-section">
            {!verified && !hideCode && <div className="verify-card"><div className="eyebrow">{tr('code')}</div><strong>{table.code}</strong><p>{tr('codeHint')}</p><button onClick={() => setHideCode(true)}>{tr('menu')} <Icon name="arrow" size={14}/></button></div>}
            {!verified && hideCode && <button className="code-inline" onClick={() => setHideCode(false)}>{tr('code')} <b>{table.code}</b></button>}
            {verified && <div className="verified"><Icon name="check" size={16}/>{tr('verified')}</div>}
            {warning && <p className="warning" role="alert">{tr('stockWarning')}</p>}
            <div className="menu-head"><h2>{tr('menu')}</h2></div>
            <label className="search"><Icon name="search" size={16}/><input placeholder={tr('search')} aria-label={tr('search')} value={search} onChange={event => setSearch(event.target.value)}/></label>
            <div className="categories" aria-label={tr('menu')}>
              <button className={category === 'all' ? 'selected' : ''} onClick={() => setCategory('all')}>{tr('all')}</button>
              {(Object.keys(categories) as Category[]).map(key => <button key={key} className={category === key ? 'selected' : ''} onClick={() => setCategory(key)}>{local(categories[key], lang)}</button>)}
            </div>
            {visible.length === 0 && <p>{tr('noProducts')}</p>}
            <div className="menu-list">{visible.map(item => <button className="product-row" key={item.id} onClick={() => setProduct(item.id)}>
              <span className={'product-thumb ' + item.category}><ProductArt category={item.category}/></span>
              <span><b>{local(item.title, lang)}</b><small>{money(item.price, lang)}</small></span><span className="add-circle"><Icon name="plus" size={16}/></span>
            </button>)}</div>
          </div>}
          {view === 'cart' && <div className="phone-section stack">
            <h2>{tr('cart')}</h2>
            {d.cart.length === 0 && <p>{tr('emptyCart')}</p>}
            {warning && <div className="warning" role="alert">{tr('stockWarning')}</div>}
            {d.cart.map((line, index) => {
              const current = d.menu[line.product-1]
              return <div className="cart-line" key={index}><div><strong>{local(current.title, lang)}</strong><small>{line.options.map(option => tr(option)).join(' · ')}</small>{current.sold && <span className="chip">{tr('soldOut')}</span>}</div>
                <b>{money(current.price, lang)}</b><button className="icon-button" aria-label={tr('remove') + ' ' + local(current.title, lang)} onClick={() => run({type:'remove', index})}><Icon name="close" size={16}/></button></div>
            })}
            <div className="total-row"><b>{tr('total')}</b><strong>{money(d.cart.reduce((sum, line) => sum + d.menu[line.product-1].price, 0), lang)}</strong></div>
            <button className="primary" disabled={!verified || warning || !d.cart.length} onClick={() => { if (run({type:'order'})) setView('orders') }}>{tr('send')}<Icon name="arrow" size={16}/></button>
            {!verified && <p className="muted">{tr('codeNeeded')}</p>}
          </div>}
          {view === 'orders' && <div className="phone-section stack"><h2>{tr('orders')}</h2>
            {guestOrders.length === 0 && <p>{tr('emptyOrder')}</p>}
            {[...guestOrders].reverse().map(order => <article className="phone-card" key={order.id}><div className="card-row"><b>{tr('order')} #{order.id}</b><span className="chip">{tr(order.status)}</span></div><LineItems lines={order.lines} lang={lang}/>{order.status === 'sent' && <button onClick={() => run({type:'cancel',id:order.id})}>{tr('cancel')}</button>}</article>)}
          </div>}
          {view === 'bill' && <div className="phone-section stack"><h2>{tr('bill')}</h2>
            <LineItems lines={billFor(d, table.id).lines} lang={lang}/>
            <div className="total-row"><b>{tr('remaining')}</b><strong>{money(billFor(d, table.id).balance,lang)}</strong></div>
            <p className="receipt-note">{tr('receipt')}</p>
          </div>}
        </>}
        {!register && d.campaign.enabled && <div className="loyalty"><span className="loyalty-icon"><Icon name="spark" size={18}/></span>
          <div><small>{tr('preview')}</small><b>{local(d.campaign.name, lang)} {loyalty}/{d.campaign.target} · {local(d.campaign.reward, lang)}</b></div>
        </div>}
      </div>
      {table && !register && <nav className="phone-tabs" aria-label={tr('guest')}>{tabs.map(([value, icon]) => <button key={value} aria-current={view === value ? 'page' : undefined} onClick={() => setView(value)}><Icon name={icon} size={17}/>{tr(value)}{value === 'cart' && d.cart.length > 0 && <span>{d.cart.length}</span>}</button>)}</nav>}
      <div className="service-actions">{(['call','billCall','cleanCall'] as Request[]).map(key => <button key={key} onClick={() => setRequest(key)}><Icon name={key === 'call' ? 'bell' : key === 'billCall' ? 'receipt' : 'spark'} size={14}/>{tr(key)}</button>)}</div>
      <div className="home-bar" aria-hidden="true"/>
    </div>
    {item && <ProductDetail key={item.id} item={item} lang={lang} close={() => setProduct(null)} onAdd={options => {
      if (run({ type:'add', product:item.id, options })) setProduct(null)
    }}/>}
    {request && <Dialog title={tr(request)} onClose={() => setRequest(null)}>
      <p>{tr(table ? 'confirmQuestion' : 'noTable')}</p>
      <div className="button-row"><button onClick={() => setRequest(null)}>{tr('close')}</button>
        {table && <button className="primary" onClick={() => { if (run({type:'request', request})) { if (request === 'billCall') setView('bill'); setRequest(null) } }}>{tr('confirm')}</button>}</div>
    </Dialog>}
  </section>
}

function ProductDetail({ item, lang, close, onAdd }: { item: Product; lang: Lang; close: () => void; onAdd: (options: Key[]) => void }) {
  const tr = (key: Key) => t(lang, key)
  const drinks = item.category === 'hot' || item.category === 'cold'
  const selectOptions: [Key, Key[]][] = [['size',['regular','small','large']], ['milk',['dairy','oat','none']], ['sugar',['none','one','two']]]
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onAdd(drinks ? selectOptions.map(([key]) => data.get(key) as Key) : [])
  }
  return <Dialog title={local(item.title, lang)} onClose={close}>
    <form onSubmit={submit} className="stack">
      <div className="product-detail-art"><ProductArt category={item.category}/><b>{money(item.price, lang)}</b></div>
      <p>{tr('allergens')} · {item.allergens.length ? item.allergens.map(key => local(allergenNames[key], lang)).join(', ') : tr('none')}</p>
      {drinks && selectOptions.map(([key, choices]) => <Field key={key} title={tr(key)}><select name={key}>{choices.map(choice => <option key={choice} value={choice}>{tr(choice)}</option>)}</select></Field>)}
      {item.sold && <p className="warning">{tr('soldOut')}</p>}
      <button className="primary" disabled={item.sold}><Icon name="plus" size={17}/>{tr('add')}</button>
    </form>
  </Dialog>
}
