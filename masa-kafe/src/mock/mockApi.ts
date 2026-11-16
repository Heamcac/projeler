import { create } from 'zustand'
import type { Copy, Key } from '../i18n'

export type Category = 'hot' | 'cold' | 'dessert' | 'snack' | 'breakfast'
export const categories: Record<Category, Copy> = {
  hot: ['Sıcak içecekler', 'Hot drinks'], cold: ['Soğuk içecekler', 'Cold drinks'],
  dessert: ['Tatlılar', 'Desserts'], snack: ['Atıştırmalıklar', 'Snacks'],
  breakfast: ['Kahvaltı', 'Breakfast'],
}
const allergens = {
  milk: ['Süt', 'Milk'], gluten: ['Glüten', 'Gluten'], eggs: ['Yumurta', 'Eggs'], nuts: ['Kuruyemiş', 'Nuts'],
} as const
export type Product = {
  id: number; category: Category; title: [string, string]; price: number
  allergens: (keyof typeof allergens)[]; sold: boolean
}
export const allergenNames = allergens
const products: [Category, string, string, number, Product['allergens']][] = [
  ['hot','Flat White','Flat white',135,['milk']], ['hot','Türk Kahvesi','Turkish coffee',95,[]],
  ['hot','Filtre Kahve','Filter coffee',110,[]], ['hot','Tarçınlı Latte','Cinnamon latte',145,['milk']],
  ['hot','Demleme Çay','Brewed tea',55,[]], ['cold','Buzlu Latte','Iced latte',145,['milk']],
  ['cold','Limonata','Lemonade',115,[]], ['cold','Soğuk Demleme','Cold brew',135,[]],
  ['cold','Şeftalili Çay','Peach iced tea',110,[]], ['dessert','San Sebastian','Basque cheesecake',195,['milk','eggs']],
  ['dessert','Çikolatalı Brownie','Chocolate brownie',155,['milk','gluten','eggs']],
  ['dessert','Limonlu Tart','Lemon tart',165,['milk','gluten','eggs']],
  ['dessert','Fındıklı Kurabiye','Hazelnut cookie',75,['gluten','nuts','eggs']],
  ['snack','Kaşarlı Tost','Cheese toastie',155,['milk','gluten']], ['snack','Patates Dilimleri','Potato wedges',125,[]],
  ['snack','Humus & Pide','Hummus & flatbread',145,['gluten']], ['snack','Zeytinli Sandviç','Olive sandwich',160,['gluten','milk']],
  ['breakfast','Avokadolu Tost','Avocado toast',225,['gluten','eggs']], ['breakfast','Granola Kasesi','Granola bowl',195,['milk','nuts']],
  ['breakfast','Menemen','Menemen eggs',210,['eggs','gluten']], ['breakfast','Kahvaltı Tabağı','Breakfast plate',265,['milk','eggs','gluten']],
  ['breakfast','Sade Kruvasan','Butter croissant',105,['milk','gluten','eggs']],
]
export const station = (category: Category): Key => category === 'hot' || category === 'cold' ? 'bar' : 'kitchen'
export type TableStatus = 'free' | 'waiting' | 'active' | 'billRequested' | 'cleaning' | 'abandoned' | 'merged'
export type OrderStatus = 'sent' | 'approved' | 'forwarded' | 'ready' | 'delivered' | 'canceled'
export type StaffStatus = 'available' | 'busy' | 'break' | 'offline'
export type TaskType = 'verifyTask' | 'order' | 'call' | 'billCall' | 'cleanCall'
export type Method = 'cash' | 'card'
export type Table = { id: number; status: TableStatus; code?: string; expires?: number; linked?: number }
export type Line = { product: number; title: Copy; price: number; options: Key[]; station: Key }
export type Order = { id: number; table: number; lines: Line[]; status: OrderStatus; forwardAt?: number }
export type Task = {
  id: number; table: number; type: TaskType; order?: number; assignee?: number
  accepted: boolean; deadline?: number; skipped?: number; pool: boolean; done: boolean
}
export type Payment = { table: number; value: number; method: Method; reason?: string; closed?: boolean }
export type Settings = { cafe: string; verifySeconds: number; acceptSeconds: number; limit: number; waiterCount: number }
export type Campaign = { name: Copy; scope: 'all' | Category; target: number; reward: Copy; enabled: boolean }
type Activity = { id: number; key: Key; time: number; table?: number; note?: string }
export type Data = {
  tables: Table[]; menu: Product[]; staff: { name: string; status: StaffStatus }[]
  tasks: Task[]; orders: Order[]; payments: Payment[]; discounts: Record<number, number>
  guest: number | null; cart: Line[]; queue: number; next: number; settings: Settings
  campaign: Campaign; activities: Activity[]; notice: Activity | null
}
type Action =
  | { type: 'scan'; table: number }
  | { type: 'leave' }
  | { type: 'verify'; table: number; code: string }
  | { type: 'end'; table: number; abandoned?: boolean; reason?: string }
  | { type: 'add'; product: number; options: Key[] }
  | { type: 'remove'; index: number }
  | { type: 'order' }
  | { type: 'advance'; id: number }
  | { type: 'approveAndSend'; id: number }
  | { type: 'cancel'; id: number; cashier?: boolean; reason?: string }
  | { type: 'request'; request: 'call' | 'billCall' | 'cleanCall' }
  | { type: 'status'; staff: number; status: StaffStatus }
  | { type: 'claim' | 'reassign'; id: number; staff: number }
  | { type: 'done'; id: number; staff: number }
  | { type: 'stock'; id: number }
  | { type: 'move' | 'merge' | 'unlink'; table: number; target: number }
  | { type: 'pay'; table: number; value: number; method: Method; close?: boolean }
  | { type: 'discount' | 'refund'; table: number; value: number; reason: string }
  | { type: 'product'; id: number; title: [string, string]; price: number }
  | { type: 'settings'; settings: Settings }
  | { type: 'campaign'; campaign: Campaign }
  | { type: 'track'; key: Key }

function lineFrom(product: Product, options: Key[] = []): Line {
  return { product: product.id, title: [...product.title], price: product.price, station: station(product.category), options }
}

function initialData(): Data {
  const statuses: Partial<Record<number, TableStatus>> = {
    4:'active', 12:'active', 18:'active', 27:'active', 35:'billRequested', 42:'cleaning',
  }
  const menu = products.map<Product>(([category, tr, en, price, list], index) =>
    ({ id:index + 1, category, title:[tr, en], price, allergens:list, sold:false }))
  const seeded: [number, number[], OrderStatus][] = [
    [4,[1,10],'delivered'], [12,[6,8],'ready'], [18,[2,14],'sent'],
    [27,[4,13],'forwarded'], [35,[18,5,22],'delivered'],
  ]
  const now = Date.now()
  return {
    tables: Array.from({ length:80 }, (_, index) => ({ id:index+1, status:statuses[index+1] ?? 'free' })),
    menu,
    staff: ['Ayşe','Mehmet','Zeynep','Can'].map(name => ({ name, status:'available' })),
    orders: seeded.map(([table, lines, status], index) => ({ id:index+1, table, status, lines:lines.map(id => lineFrom(menu[id-1])) })),
    tasks: [
      { id:6, table:18, type:'order', order:3, assignee:0, accepted:false, deadline:now+60000, pool:false, done:false },
      { id:7, table:35, type:'billCall', assignee:1, accepted:false, deadline:now+60000, pool:false, done:false },
      { id:8, table:42, type:'cleanCall', assignee:2, accepted:false, deadline:now+60000, pool:true, done:false },
    ],
    payments:[], discounts:{}, guest:null, cart:[], queue:3, next:9,
    settings:{ cafe:'', verifySeconds:180, acceptSeconds:60, limit:3, waiterCount:4 },
    campaign:{ name:['Kahve','Coffee'], scope:'hot', target:5, reward:['bir sonraki bizden','the next one is on us'], enabled:true },
    activities:[{ id:0, key:'started', time:now }], notice:null,
  }
}

export const tableAt = (d: Data, id: number) => d.tables[id-1]
const rootTable = (d: Data, id: number) => tableAt(d, id)?.linked ?? id
export const ordersFor = (d: Data, id: number) => {
  const root = rootTable(d, id)
  return d.orders.filter(o => rootTable(d, o.table) === root)
}
export const billFor = (d: Data, id: number) => {
  const root = rootTable(d, id)
  const lines = ordersFor(d, id).filter(o => o.status !== 'canceled').flatMap(o => o.lines)
  const total = lines.reduce((sum, line) => sum + line.price, 0)
  const discount = Math.max(0, Math.min(total, d.discounts[root] ?? 0))
  const paid = d.payments.filter(p => p.table === root && !p.closed).reduce((sum, p) => sum + p.value, 0)
  return { lines, total, discount, paid, balance: Math.max(0, total - discount - paid) }
}
export const openTab = (table: Table) => table.status === 'active' || table.status === 'billRequested'
export const openTasks = (d: Data) => d.tasks.filter(task => !task.done)
export function eligible(d: Data, index: number, omit?: number) {
  return index >= 0 && index < d.settings.waiterCount && d.staff[index]?.status === 'available'
    && openTasks(d).filter(task => task.assignee === index && task.id !== omit).length < d.settings.limit
}
function assign(d: Data, task: Task, now: number) {
  const count = d.settings.waiterCount
  for (let offset = 0; offset < count; offset++) {
    const index = (d.queue + offset) % count
    if (index === task.skipped || !eligible(d, index, task.id)) continue
    task.assignee = index
    task.skipped = undefined
    task.deadline = now + d.settings.acceptSeconds * 1000
    d.queue = (index + 1) % count
    return
  }
  task.assignee = undefined
  task.deadline = undefined
  task.pool = true
}
function createTask(d: Data, table: number, type: TaskType, now: number, order?: number) {
  const task: Task = { id:d.next++, table, type, order, accepted:false, pool:false, done:false }
  assign(d, task, now)
  d.tasks.push(task)
}
function log(d: Data, key: Key, now: number, table?: number, note?: string, notify = false) {
  const entry = { id:d.next++, key, time:now, table, note }
  d.activities.unshift(entry)
  if (notify) d.notice = entry
}
function closeSession(d: Data, id: number, status: TableStatus) {
  const ids = d.tables.filter(table => table.id === id || table.linked === id).map(table => table.id)
  for (const tableId of ids) d.tables[tableId-1] = { id:tableId, status:tableId === id ? status : 'free' }
  d.orders = d.orders.filter(order => !ids.includes(order.table))
  for (const task of openTasks(d)) if (ids.includes(task.table)) task.done = true
  for (const tableId of ids) delete d.discounts[tableId]
  if (d.guest !== null && ids.includes(d.guest)) {
    d.guest = null
    d.cart = []
  }
}
function reconcile(d: Data, now: number): boolean {
  let changed = false
  for (const order of d.orders) {
    if (order.status !== 'approved' || (order.forwardAt ?? Infinity) > now) continue
    apply(d, { type:'advance', id:order.id }, now)
    changed = true
  }
  for (const table of d.tables) {
    if (table.status !== 'waiting' || (table.expires ?? Infinity) > now) continue
    const isGuest = d.guest === table.id
    closeSession(d, table.id, 'free')
    log(d, 'expired', now, table.id, undefined, isGuest)
    changed = true
  }
  for (const task of openTasks(d)) {
    if (task.accepted) continue
    const previous = task.assignee
    const expired = previous !== undefined && (task.deadline ?? Infinity) <= now
    const inactive = previous !== undefined && (previous >= d.settings.waiterCount || d.staff[previous].status !== 'available')
    if (expired || inactive) {
      task.pool = true
      task.skipped = expired ? previous : undefined
    }
    if (previous === undefined || expired || inactive) assign(d, task, now)
    if (previous !== task.assignee || expired || inactive) changed = true
    if (expired) log(d, 'reassign', now, task.table, task.assignee === undefined ? undefined : d.staff[task.assignee].name, true)
  }
  return changed
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  sent:'approved', approved:'forwarded', forwarded:'ready', ready:'delivered',
}
function apply(d: Data, action: Action, now: number): Key | undefined {
  switch (action.type) {
    case 'scan': {
      const table = tableAt(d, action.table)
      if (!table || table.status !== 'free') return 'occupied'
      d.guest = table.id
      d.cart = []
      table.status = 'waiting'
      table.code = String(1000 + (table.id * 73 + d.next * 17) % 9000)
      table.expires = now + d.settings.verifySeconds * 1000
      createTask(d, table.id, 'verifyTask', now)
      log(d, 'verifyTask', now, table.id, undefined, true)
      break
    }
    case 'leave':
      d.guest = null
      d.cart = []
      log(d, 'changeTable', now)
      break
    case 'verify': {
      const table = tableAt(d, action.table)
      if (table?.status !== 'waiting' || (table.expires ?? 0) <= now) return 'expired'
      if (action.code !== table.code) return 'badCode'
      d.tables[table.id-1] = { id:table.id, status:'active' }
      for (const task of openTasks(d)) if (task.table === table.id && task.type === 'verifyTask') task.done = true
      log(d, 'verified', now, table.id, undefined, true)
      break
    }
    case 'end': {
      const table = tableAt(d, action.table)
      if (!table || (!action.abandoned && table.status !== 'waiting') || (action.abandoned && !openTab(table))) return 'unavailable'
      if (action.abandoned && !action.reason?.trim()) return 'reasonRequired'
      closeSession(d, table.id, action.abandoned ? 'abandoned' : 'free')
      log(d, action.abandoned ? 'abandoned' : 'sessionClosed', now, table.id, action.reason, true)
      break
    }
    case 'add': {
      const product = d.menu.find(item => item.id === action.product)
      if (!d.guest || !product || product.sold) return 'unavailable'
      d.cart.push(lineFrom(product, action.options))
      log(d, 'add', now, d.guest, product.title.join(' / '))
      break
    }
    case 'remove':
      d.cart.splice(action.index, 1)
      log(d, 'remove', now, d.guest ?? undefined)
      break
    case 'order': {
      if (!d.guest || !openTab(tableAt(d, rootTable(d, d.guest)))) return 'codeNeeded'
      if (!d.cart.length) return 'emptyCart'
      if (d.cart.some(line => d.menu[line.product-1]?.sold)) return 'stockWarning'
      const lines = d.cart.map(line => ({ ...line, price:d.menu[line.product-1].price, title:d.menu[line.product-1].title }))
      const order: Order = { id:d.next++, table:d.guest, lines, status:'sent' }
      d.orders.push(order)
      d.cart = []
      createTask(d, order.table, 'order', now, order.id)
      log(d, 'sent', now, order.table, undefined, true)
      break
    }
    case 'approveAndSend':
    case 'advance': {
      const order = d.orders.find(item => item.id === action.id)
      const next = order && nextStatus[order.status]
      if (!order || !next || (action.type === 'approveAndSend' && order.status !== 'sent')) return 'unavailable'
      order.status = next
      order.forwardAt = action.type === 'approveAndSend' ? now + 650 : undefined
      if (next === 'forwarded') for (const task of openTasks(d)) if (task.order === order.id) task.done = true
      log(d, next, now, order.table, undefined, true)
      break
    }
    case 'cancel': {
      const order = d.orders.find(item => item.id === action.id)
      if (!order || order.status === 'canceled') return 'unavailable'
      if (action.cashier && !action.reason?.trim()) return 'reasonRequired'
      if (!action.cashier && order.status !== 'sent') return 'cashierOnly'
      order.status = 'canceled'
      for (const task of openTasks(d)) if (task.order === order.id) task.done = true
      log(d, 'canceled', now, order.table, action.reason, true)
      break
    }
    case 'request': {
      if (!d.guest) return 'noTable'
      const id = rootTable(d, d.guest)
      const table = tableAt(d, id)
      if (action.request === 'billCall' && !openTab(table)) return 'codeNeeded'
      if (!openTasks(d).some(task => task.table === id && task.type === action.request)) {
        if (action.request === 'billCall') table.status = 'billRequested'
        createTask(d, id, action.request, now)
        log(d, action.request, now, id, undefined, true)
      }
      break
    }
    case 'status':
      d.staff[action.staff].status = action.status
      log(d, action.status, now, undefined, d.staff[action.staff].name)
      break
    case 'claim':
    case 'reassign': {
      const task = openTasks(d).find(item => item.id === action.id)
      const manual = action.type === 'reassign'
      if (!task || !eligible(d, action.staff, task.id) || (!manual && (task.accepted || (!task.pool && task.assignee !== action.staff)))) return 'unavailable'
      task.assignee = action.staff
      task.skipped = undefined
      task.accepted = !manual
      task.deadline = manual ? now + d.settings.acceptSeconds * 1000 : undefined
      task.pool = false
      log(d, manual ? 'reassign' : 'accept', now, task.table, d.staff[action.staff].name, manual)
      break
    }
    case 'done': {
      const task = openTasks(d).find(item => item.id === action.id)
      if (!task || !task.accepted || task.assignee !== action.staff || (task.type !== 'call' && task.type !== 'cleanCall' && task.type !== 'billCall')) return 'unavailable'
      task.done = true
      if (task.type === 'cleanCall' && tableAt(d, task.table).status === 'cleaning') tableAt(d, task.table).status = 'free'
      log(d, task.type === 'cleanCall' ? 'cleaned' : 'complete', now, task.table, undefined, true)
      break
    }
    case 'move':
    case 'merge':
    case 'unlink': {
      const from = tableAt(d, action.table)
      const to = tableAt(d, action.target)
      if (!from || !to || from === to || !openTab(from)) return 'noSelection'
      if (action.type === 'unlink') {
        if (to.linked !== from.id) return 'noSelection'
        d.tables[to.id-1] = { id:to.id, status:'free' }
      } else {
        if (to.status !== 'free') return 'occupied'
        if (action.type === 'merge') d.tables[to.id-1] = { id:to.id, status:'merged', linked:from.id }
        else {
          d.tables[to.id-1] = { ...from, id:to.id }
          d.tables[from.id-1] = { id:from.id, status:'free' }
          for (const table of d.tables) if (table.linked === from.id) table.linked = to.id
          for (const order of d.orders) if (order.table === from.id) order.table = to.id
          for (const task of openTasks(d)) if (task.table === from.id) task.table = to.id
          for (const payment of d.payments) if (!payment.closed && payment.table === from.id) payment.table = to.id
          d.discounts[to.id] = d.discounts[from.id] ?? 0
          delete d.discounts[from.id]
          if (d.guest === from.id) d.guest = to.id
        }
      }
      log(d, action.type === 'unlink' ? 'splitTable' : action.type, now, from.id, '→ #' + to.id, true)
      break
    }
    case 'pay': {
      const id = rootTable(d, action.table)
      if (!openTab(tableAt(d, id))) return 'unavailable'
      const bill = billFor(d, id)
      if (action.close && bill.paid > bill.total - bill.discount + .005) return 'refundNeeded'
      const value = action.close ? bill.balance : Math.min(bill.balance, Math.max(0, action.value))
      if (!Number.isFinite(value) || (!action.close && value <= 0)) return 'unavailable'
      d.payments.push({ table:id, value, method:action.method, closed:!!action.close })
      if (action.close) {
        for (const payment of d.payments) if (payment.table === id) payment.closed = true
        closeSession(d, id, 'cleaning')
        createTask(d, id, 'cleanCall', now)
      }
      log(d, action.close ? 'closeBill' : 'payShare', now, id, undefined, true)
      break
    }
    case 'discount':
    case 'refund': {
      const id = rootTable(d, action.table)
      if (!openTab(tableAt(d, id)) || !Number.isFinite(action.value) || action.value <= 0) return 'unavailable'
      if (!action.reason.trim()) return 'reasonRequired'
      const bill = billFor(d, id)
      if (action.type === 'discount') d.discounts[id] = Math.max(0, Math.min(bill.total - bill.paid, bill.discount + action.value))
      else {
        if (bill.paid <= 0) return 'unavailable'
        const method = [...d.payments].reverse().find(payment => payment.table === id && !payment.closed)?.method ?? 'cash'
        d.payments.push({ table:id, value:-Math.min(action.value, bill.paid), method, reason:action.reason })
      }
      log(d, action.type, now, id, action.reason, true)
      break
    }
    case 'stock': {
      const product = d.menu.find(item => item.id === action.id)
      if (!product) return 'unavailable'
      product.sold = !product.sold
      log(d, product.sold ? 'soldOut' : 'restore', now, undefined, product.title.join(' / '), true)
      break
    }
    case 'product': {
      const product = d.menu.find(item => item.id === action.id)
      if (!product || action.title.some(title => !title.trim()) || !Number.isFinite(action.price) || action.price < 0) return 'unavailable'
      product.title = action.title.map(title => title.trim()) as [string, string]
      product.price = action.price
      log(d, 'menu', now, undefined, product.title.join(' / '), true)
      break
    }
    case 'settings': {
      const limits = { verifySeconds:[5,3600], acceptSeconds:[3,600], limit:[1,20], waiterCount:[1,4] } as const
      for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
        const value = action.settings[key]
        if (!Number.isInteger(value) || value < limits[key][0] || value > limits[key][1]) return 'unavailable'
      }
      d.settings = { ...action.settings }
      d.queue %= d.settings.waiterCount
      const kept = d.staff.map((_, index) => openTasks(d).filter(task => task.accepted && task.assignee === index).length)
      for (const task of openTasks(d)) {
        if (task.accepted && (task.assignee ?? -1) >= d.settings.waiterCount) {
          task.accepted = false
          task.pool = true
        }
        if (!task.accepted && task.assignee !== undefined) {
          const index = task.assignee
          if (index < d.settings.waiterCount && kept[index] >= d.settings.limit) {
            task.assignee = undefined
            task.deadline = undefined
            task.pool = true
          } else {
            kept[index]++
            task.deadline = now + d.settings.acceptSeconds * 1000
          }
        }
      }
      log(d, 'settings', now, undefined, undefined, true)
      break
    }
    case 'campaign':
      if (!Number.isInteger(action.campaign.target) || action.campaign.target < 1 || !action.campaign.name[0].trim() || !action.campaign.reward[0].trim()) return 'unavailable'
      d.campaign = { ...action.campaign }
      log(d, 'campaign', now, undefined, undefined, true)
      break
    case 'track':
      log(d, action.key, now, d.guest ?? undefined)
      break
  }
}
export const useDemo = create<{
  data: Data; act: (action: Action) => Key | undefined; tick: () => void; reset: () => void
}>((set, get) => ({
  data: initialData(),
  act(action) {
    const data = structuredClone(get().data)
    const now = Date.now()
    const error = apply(data, action, now)
    if (error) return error
    reconcile(data, now)
    set({ data })
  },
  tick() {
    const data = structuredClone(get().data)
    if (reconcile(data, Date.now())) set({ data })
  },
  reset: () => set({ data:initialData() }),
}))
