import { useEffect, useState, type FormEvent } from 'react'
import { local, money, t, type Key, type Lang } from './i18n'
import { billFor, categories, eligible, openTab, openTasks, ordersFor, tableAt, type Category, type Data, type Order, type StaffStatus, type Table, type Task, useDemo } from './mock/mockApi'
import { Dialog, Field, Icon, LineItems, SectionTitle, Stat, Status, statusMarks } from './ui'

export type Run = (action: Parameters<ReturnType<typeof useDemo.getState>['act']>[0]) => boolean
export type WaiterView = 'overview' | 'orders' | 'stock'
type Props = { lang: Lang; d: Data; run: Run }
const waiterStates: StaffStatus[] = ['available','busy','break','offline']

export function Waiter({ lang, d, run, staff, setStaff, view, setView }: Props & {
  staff: number; setStaff: (value: number) => void; view: WaiterView; setView: (view: WaiterView) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [pool, showPool] = useState(false)
  const tr = (key: Key) => t(lang, key)
  const who = Math.min(staff, d.settings.waiterCount - 1)
  const allTasks = openTasks(d)
  const visibleTasks = allTasks.filter(task => pool ? task.pool && !task.accepted : task.assignee === who)
  const waiting = d.tables.filter(table => table.status === 'waiting')
  const tab = selected === null ? undefined : tableAt(d, selected)
  const next = Array.from({ length:d.settings.waiterCount }, (_, index) => (d.queue + index) % d.settings.waiterCount)
  const tabs: [WaiterView, 'grid' | 'bag' | 'package'][] = [['overview','grid'],['orders','bag'],['stock','package']]
  return <>
    <SectionTitle eyebrow={tr('venue')} title={tr('section')} detail={tr('waiterDesc')}>
      <div className="staff-control"><span className="avatar">{d.staff[who].name[0]}</span><div>
        <select value={who} aria-label={tr('staff')} onChange={event => setStaff(Number(event.target.value))}>{d.staff.slice(0, d.settings.waiterCount).map((person, index) => <option key={person.name} value={index}>{person.name}</option>)}</select>
        <select value={d.staff[who].status} aria-label={tr('status')} onChange={event => run({type:'status',staff:who,status:event.target.value as StaffStatus})}>{waiterStates.map(status => <option key={status} value={status}>{tr(status)}</option>)}</select>
      </div></div>
    </SectionTitle>
    <div className="stats">
      <Stat label={tr('totalTables')} value={d.tables.length} icon="grid"/>
      <Stat label={tr('activeTables')} value={d.tables.filter(table => table.status === 'active').length} icon="users"/>
      <Stat label={tr('openTasks')} value={allTasks.length} icon="bell"/>
      <Stat label={tr('accounts')} value={d.tables.filter(table => openTab(table) && billFor(d,table.id).total > 0).length} icon="receipt"/>
    </div>
    <div className="subtabs">{tabs.map(([key, icon]) => <button className={view === key ? 'selected' : ''} key={key} onClick={() => setView(key)} aria-pressed={view === key}><Icon name={icon} size={16}/>{tr(key)}</button>)}</div>
    {view === 'overview' && <div className="waiter-grid">
      <section className="surface tasks-panel">
        <div className="surface-title"><div><h2>{tr('tasks')}</h2><p>{tr('tasksSubtitle')}</p></div><span className="count">{allTasks.length}</span></div>
        <div className="task-filter"><button aria-pressed={!pool} className={!pool ? 'selected' : ''} onClick={() => showPool(false)}>{tr('myTasks')}</button><button aria-pressed={pool} className={pool ? 'selected' : ''} onClick={() => showPool(true)}>{tr('pool')}</button></div>
        <div className="tasks-list">
          {visibleTasks.length === 0 && <p className="muted">{tr('idleTasks')}</p>}
          {visibleTasks.map(task => <TaskCard key={task.id} {...{lang,d,run,task,who}} openOrders={() => setView('orders')}/>)}
        </div>
        {waiting.filter(table => !visibleTasks.some(task => task.type === 'verifyTask' && task.table === table.id)).map(table =>
          <div className="task-card" key={table.id}><div className="task-card-top"><span className="task-icon"><Icon name="qr" size={18}/></span><div><strong>{tr('verifyTask')}</strong><small>{tr('table')} {table.id}</small></div></div><Verification {...{lang,run,table}}/></div>)}
        <div className="queue"><span className="eyebrow">{tr('queue')}</span><div>{next.map(index => <span key={index} className={eligible(d,index) ? 'on' : ''}>{d.staff[index].name}</span>)}</div></div>
      </section>
      <section className="surface map-panel"><div className="surface-title"><div><h2>{tr('map')}</h2><p>{tr('mapDesc')}</p></div><span className="map-icon"><Icon name="grid" size={16}/></span></div>
        <div className="legend">{(['free','active','waiting','billRequested','cleaning'] as const).map(status => <Status key={status} {...{status,lang}}/>)}</div>
        <div className="table-map">{d.tables.map(table => <button key={table.id} onClick={() => setSelected(table.id)}
          aria-label={tr('table') + ' ' + table.id + ' · ' + tr(table.status)} className={'table-tile ' + table.status}>
          <b>{String(table.id).padStart(2,'0')}</b><span aria-hidden="true">{statusMarks[table.status]}</span><small>{tr(table.status)}</small>
        </button>)}</div>
      </section>
    </div>}
    {view === 'orders' && <section className="surface"><div className="surface-title"><h2>{tr('orders')}</h2></div>
      {!d.orders.some(order => order.status !== 'delivered' && order.status !== 'canceled') && <p>{tr('noWaiting')}</p>}
      <div className="order-grid">{[...d.orders].reverse().filter(order => order.status !== 'delivered' && order.status !== 'canceled').map(order => <OrderCard key={order.id} {...{lang,run,order}}/>)}</div></section>}
    {view === 'stock' && <Stock {...{lang,d,run}}/>}
    {tab && <TableDetails key={tab.id} {...{lang,d,run,table:tab}} close={() => setSelected(null)}/>}
  </>
}

function TaskCard({ lang, d, run, task, who, openOrders }: Props & { task: Task; who: number; openOrders: () => void }) {
  const tr = (key: Key) => t(lang, key)
  const table = tableAt(d, task.table)
  const order = d.orders.find(order => order.id === task.order)
  const icon = task.type === 'verifyTask' ? 'qr' : task.type === 'order' ? 'bag' : task.type === 'cleanCall' ? 'spark' : task.type === 'billCall' ? 'receipt' : 'bell'
  return <article className="task-card">
    <div className="task-card-top"><span className="task-icon"><Icon name={icon} size={19}/></span>
      <div><strong>{tr(task.type)}</strong><small>{tr('table')} {String(task.table).padStart(2,'0')}{order && ' · #' + order.id}</small></div>
      {task.deadline !== undefined && <Countdown deadline={task.deadline} lang={lang}/>}
    </div>
    {task.type === 'verifyTask' && table.status === 'waiting' && <Verification {...{lang,run,table}}/>}
    {task.type === 'order' && order && <button onClick={openOrders}>{tr('orders')} <Icon name="chevron" size={14}/></button>}
    {!task.accepted && <button className="quiet-accent" disabled={!eligible(d, who, task.id)} onClick={() => run({type:'claim',id:task.id,staff:who})}>{tr('accept')} <Icon name="arrow" size={15}/></button>}
    {task.accepted && task.type !== 'verifyTask' && task.type !== 'order' && <button className="primary" onClick={() => run({type:'done',id:task.id,staff:who})}>{tr(task.type === 'cleanCall' ? 'cleaned' : 'complete')}</button>}
  </article>
}

function Countdown({ deadline, lang }: { deadline: number; lang: Lang }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  },[])
  return <span className="timer"><Icon name="clock" size={13}/>{Math.max(0,Math.ceil((deadline - now) / 1000))} {t(lang,'seconds')}</span>
}

function Verification({ lang, run, table }: Pick<Props, 'lang' | 'run'> & { table: Table }) {
  const tr = (key: Key) => t(lang, key)
  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    run({type:'verify',table:table.id,code:String(new FormData(event.currentTarget).get('code'))})
  }
  return <form className="verification stack" onSubmit={verify}>
    <small>{tr('expected')} <b className="tabular">{table.code}</b></small>
    <div className="input-row"><input aria-label={tr('enterCode')} placeholder={tr('enterCode')} name="code" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4}/><button className="primary">{tr('verify')}</button></div>
    <button className="text-button" type="button" onClick={() => run({type:'end',table:table.id})}>{tr('nobody')}</button>
  </form>
}

function OrderCard({ lang, run, order }: Pick<Props, 'lang' | 'run'> & { order: Order }) {
  const tr = (key: Key) => t(lang, key)
  const status = order.status
  return <article className="border-card stack">
    <div className="card-row"><h3>{tr('table')} {order.table} · #{order.id}</h3><span className="chip">{tr(status)}</span></div>
    <LineItems lines={order.lines} lang={lang} tags/>
    {status === 'sent' && <button className="primary" onClick={() => run({type:'approveAndSend',id:order.id})}>{tr('sendKitchen')}</button>}
    {status === 'approved' && <button className="primary" onClick={() => run({type:'advance',id:order.id})}>{tr('sendKitchen')}</button>}
    {status === 'forwarded' && <button className="primary" onClick={() => run({type:'advance',id:order.id})}>{tr('readyAction')}</button>}
    {status === 'ready' && <button className="primary" onClick={() => run({type:'advance',id:order.id})}>{tr('deliveredAction')}</button>}
    {status !== 'sent' && <><button disabled>{tr('cancel')}</button><small className="muted">{tr('cashierOnly')}</small></>}
  </article>
}

function TableDetails({ lang, d, run, table, close }: Props & { table: Table; close: () => void }) {
  const tr = (key: Key) => t(lang, key)
  const [target, setTarget] = useState(0)
  const [abandon, setAbandon] = useState(false)
  const linked = d.tables.filter(item => item.linked === table.id)
  return <Dialog title={tr('table') + ' ' + table.id} onClose={close}>
    <div className="stack"><Status status={table.status} lang={lang}/>
      {table.linked && <p>{tr('merged')} · {tr('table')} {table.linked}</p>}
      {table.status === 'waiting' && <Verification {...{lang,run,table}}/>}
      {openTab(table) && <>
        <LineItems lines={billFor(d,table.id).lines} lang={lang}/>
        <div className="total-row"><b>{tr('remaining')}</b><strong>{money(billFor(d,table.id).balance,lang)}</strong></div>
        <Field title={tr('target')}><select value={target} onChange={event => setTarget(Number(event.target.value))}><option value={0}>{tr('choose')}</option>
          {d.tables.filter(item => item.id !== table.id).map(item => <option key={item.id} value={item.id}>{tr('table')} {item.id} · {tr(item.status)}</option>)}</select></Field>
        <div className="button-row"><button disabled={!target} onClick={() => { if (run({type:'move',table:table.id,target})) close() }}>{tr('move')}</button><button disabled={!target} onClick={() => run({type:'merge',table:table.id,target})}>{tr('merge')}</button></div>
        {linked.map(item => <div className="card-row" key={item.id}><span>{tr('merged')} · {item.id}</span><button onClick={() => run({type:'unlink',table:table.id,target:item.id})}>{tr('splitTable')}</button></div>)}
        <button className="danger" onClick={() => setAbandon(!abandon)}>{tr('abandoned')}</button>
        {abandon && <form className="stack" onSubmit={event => {
          event.preventDefault()
          if (run({type:'end',table:table.id,abandoned:true,reason:String(new FormData(event.currentTarget).get('reason'))})) close()
        }}><p>{tr('confirmQuestion')}</p><Field title={tr('reason')}><input required name="reason"/></Field>
          <button className="danger">{tr('confirm')}</button><p className="receipt-note">{tr('preview')} · {tr('previewDebt')}</p></form>}
      </>}
    </div>
  </Dialog>
}

export function Stock({ lang, d, run }: Props) {
  const tr = (key: Key) => t(lang,key)
  const [category, setCategory] = useState<Category | 'all'>('all')
  return <section className="surface">
    <div className="surface-title"><h2>{tr('stock')}</h2><select aria-label={tr('stock')} value={category} onChange={event => setCategory(event.target.value as Category | 'all')}>
      <option value="all">{tr('all')}</option>{(Object.keys(categories) as Category[]).map(key => <option key={key} value={key}>{local(categories[key],lang)}</option>)}
    </select></div>
    <div className="stock-grid">{d.menu.filter(item => category === 'all' || item.category === category).map(item => <div className="stock-row" key={item.id}>
      <div><strong>{local(item.title,lang)}</strong><small>{local(categories[item.category],lang)} · {money(item.price,lang)}</small></div>
      <button className={item.sold ? 'quiet-accent' : ''} onClick={() => run({type:'stock',id:item.id})} aria-label={tr(item.sold ? 'restore' : 'soldOut') + ' · ' + local(item.title,lang)}>{tr(item.sold ? 'restore' : 'soldOut')}</button>
    </div>)}</div>
  </section>
}

export function Cashier({ lang, d, run, selected, setSelected }: Props & { selected: number | null; setSelected: (value: number | null) => void }) {
  const [view, setView] = useState<'accounts' | 'stock' | 'tasks' | 'preview'>('accounts')
  const tr = (key: Key) => t(lang,key)
  const tabs = d.tables.filter(table => {
    if (!openTab(table)) return false
    const bill = billFor(d,table.id)
    return bill.total > 0 || bill.paid > 0 || table.status === 'billRequested'
  })
  const current = tabs.find(table => table.id === selected)
  const count = d.activities.filter(entry => entry.key === 'sent').length + 5
  const sales = d.payments.reduce((sum, payment) => sum + payment.value, 0)
  const closed = d.activities.filter(entry => entry.key === 'closeBill').length
  return <>
    <SectionTitle eyebrow={tr('venue')} title={tr('cashier')} detail={tr('accounts')}/>
    <div className="stats three"><Stat label={tr('sales')} value={money(sales,lang)} icon="receipt"/><Stat label={tr('closedBills')} value={closed} icon="check"/><Stat label={tr('dayOrders')} value={count} icon="bag"/></div>
    <div className="subtabs">{(['accounts','stock','tasks','preview'] as const).map(key => <button key={key} aria-pressed={key === view} className={key === view ? 'selected' : ''} onClick={() => setView(key)}>{tr(key)}</button>)}</div>
    {view === 'stock' && <Stock {...{lang,d,run}}/>}
    {view === 'tasks' && <section className="surface stack"><h2>{tr('reassign')}</h2>{openTasks(d).map(task => <form key={task.id} className="card-row reassign-row" onSubmit={event => {
      event.preventDefault()
      run({type:'reassign',id:task.id,staff:Number(new FormData(event.currentTarget).get('staff'))})
    }}><div><b>{tr('table')} {task.table} · {tr(task.type)}</b><small>{task.assignee !== undefined ? d.staff[task.assignee].name : tr('pool')}</small></div>
      <select name="staff" aria-label={tr('staff')} defaultValue={task.assignee ?? 0}>{d.staff.slice(0,d.settings.waiterCount).map((person,index) => <option key={person.name} value={index}>{person.name}</option>)}</select><button>{tr('reassign')}</button>
    </form>)}</section>}
    {view === 'preview' && <div className="order-grid"><article className="surface stack"><span className="chip">{tr('preview')}</span><h2>{tr('loyalty')}</h2><p>{tr('previewLoyalty')} · 3/{d.campaign.target}</p></article>
      <article className="surface stack"><span className="chip">{tr('preview')}</span><h2>{tr('previewDebt')}</h2><p>{tr('previewDebtBody')}</p></article></div>}
    {view === 'accounts' && <section className="surface stack"><div className="surface-title"><h2>{tr('accounts')}</h2><span className="count">{tabs.length}</span></div>
      {tabs.length === 0 && <p>{tr('noBills')}</p>}
      {tabs.map(table => <button className="account-row" key={table.id} onClick={() => setSelected(table.id)}>
        <span className="task-icon"><Icon name="receipt" size={18}/></span><strong>{tr('table')} {table.id}</strong><Status status={table.status} lang={lang}/>
        <b>{money(billFor(d,table.id).balance,lang)}</b><Icon name="chevron" size={16}/></button>)}
    </section>}
    {current && <CashDetails key={current.id} {...{lang,d,run,table:current}} close={() => setSelected(null)}/>}
  </>
}

function CashDetails({ lang, d, run, table, close }: Props & { table: Table; close: () => void }) {
  const tr = (key: Key) => t(lang,key)
  const bill = billFor(d,table.id)
  const [method, setMethod] = useState<'cash' | 'card'>('cash')
  const [parts, setParts] = useState(2)
  const [adjust, setAdjust] = useState<'discount' | 'refund' | number | null>(null)
  const share = Math.min(bill.balance, Math.round((bill.total - bill.discount) / parts * 100) / 100)
  return <Dialog title={tr('bill') + ' · ' + tr('table') + ' ' + table.id} onClose={close}>
    <div className="stack">
      <Status status={table.status} lang={lang}/><LineItems lines={bill.lines} lang={lang}/>
      {bill.discount > 0 && <div className="card-row"><span>{tr('discount')}</span><b>{money(bill.discount,lang)}</b></div>}
      {bill.paid > 0 && <div className="card-row"><span>{tr('paid')}</span><b>{money(bill.paid,lang)}</b></div>}
      <div className="total-row"><b>{tr('remaining')}</b><strong>{money(bill.balance,lang)}</strong></div>
      <Field title={tr('payment')}><select value={method} onChange={event => setMethod(event.target.value as 'cash' | 'card')}><option value="cash">{tr('cash')}</option><option value="card">{tr('card')}</option></select></Field>
      <details className="border-card"><summary>{tr('splitBill')}</summary><div className="stack split-form">
        <Field title={tr('people')}><input type="number" min={2} max={20} value={parts} onChange={event => setParts(Math.max(2, Math.min(20, Number(event.target.value))))}/></Field>
        <div className="card-row"><span>{tr('perPerson')}</span><b>{money(share,lang)}</b></div><button disabled={!share} onClick={() => run({type:'pay',table:table.id,value:share,method})}>{tr('payShare')}</button>
      </div></details>
      <div className="button-row"><button onClick={() => setAdjust('discount')}>{tr('discount')}</button><button disabled={bill.paid <= 0} onClick={() => setAdjust('refund')}>{tr('refund')}</button></div>
      {ordersFor(d,table.id).filter(order => order.status !== 'canceled').map(order => <div className="card-row" key={order.id}><span>#{order.id} · {tr(order.status)}</span><button onClick={() => setAdjust(order.id)}>{tr('cancel')}</button></div>)}
      {adjust !== null && <form key={adjust} className="stack border-card" onSubmit={event => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const reason = String(form.get('reason'))
        const success = typeof adjust === 'number'
          ? run({type:'cancel',id:adjust,cashier:true,reason})
          : run({type:adjust,table:table.id,value:Number(form.get('amount')),reason})
        if (success) setAdjust(null)
      }}>
        <h3>{tr(typeof adjust === 'number' ? 'cancel' : adjust)}</h3>
        {typeof adjust !== 'number' && <Field title={tr('amount')}><input name="amount" type="number" min=".01" step=".01" required/></Field>}
        <Field title={tr('reason')}><input name="reason" required/></Field><button>{tr('confirm')}</button>
      </form>}
      <button className="primary" onClick={() => { if (run({type:'pay',table:table.id,value:0,method,close:true})) close() }}>{tr('closeBill')}<Icon name="check" size={17}/></button>
      <p className="receipt-note">{tr('receipt')}</p>
    </div>
  </Dialog>
}
