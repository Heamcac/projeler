import type { Copy } from './i18n'
import { eligible, openTasks, tableAt, type Data } from './mock/mockApi'
import type { GuestView } from './Guest'
import type { Run, WaiterView } from './Operations'

export type Panel = 'waiter' | 'cashier' | 'admin'
export type Scenario = 'mainFlow' | 'miniMove' | 'miniStock'
type Context = { d: Data; run: Run; panel: (panel: Panel) => void; guest: (view: GuestView) => void; waiter: (view: WaiterView) => void; staff: (id: number) => void }
type Step = { hint: Copy; done?: (d: Data) => boolean; perform: (context: Context) => boolean }
const table = 7
const orders = (d: Data) => d.orders.filter(order => order.table === table && order.status !== 'canceled')
const scanned = (d: Data) => d.guest === table
const has = (d: Data, key: Data['activities'][number]['key'], id = table) => d.activities.some(entry => entry.key === key && entry.table === id)

const scan: Step = {
  hint:['Telefonda Masa 07’yi seçip Menüye geç’e basın.', 'Select Table 07 on the phone and open the menu.'],
  done:scanned,
  perform:({run,guest,panel,waiter}) => {
    panel('waiter')
    waiter('overview')
    guest('menu')
    return run({type:'scan',table})
  },
}
const showCode: Step = {
  hint:['Telefondaki dört haneli kodu müşteriye gösterin.', 'Point out the four-digit code on the phone.'],
  perform:({guest}) => { guest('menu'); return true },
}
const verify: Step = {
  hint:['Garson panelinde telefondaki kodu girip eşleştirin.', 'Enter the phone’s code in the Waiter panel.'],
  done:d => has(d,'verified'),
  perform:({d,run,panel,waiter}) => {
    panel('waiter')
    waiter('overview')
    return run({type:'verify',table,code:tableAt(d,table).code ?? ''})
  },
}
function addAndSend(context: Context, product: number) {
  const {d,run,guest,panel,waiter} = context
  if (!d.cart.length && !run({type:'add',product,options:[]})) return false
  if (!run({type:'order'})) return false
  guest('orders')
  panel('waiter')
  waiter('orders')
  return true
}

export const scenarios: Record<Scenario, Step[]> = {
  mainFlow:[
    scan, showCode, verify,
    { hint:['Telefondan Flat White’ı sepete ekleyip ilk siparişi gönderin.', 'Add a flat white and send the first order from the phone.'], done:d => orders(d).length > 0, perform:c => addAndSend(c,1) },
    { hint:['Garson siparişi onaylayıp mutfağa iletsin.', 'Approve the order in the Waiter panel and send it to the kitchen.'],
      done:d => ['forwarded','ready','delivered'].includes(orders(d)[0]?.status),
      perform:({d,run,panel,waiter}) => {
        panel('waiter')
        waiter('orders')
        const order = orders(d)[0]
        if (!order) return false
        if (order.status === 'sent' && !run({type:'advance',id:order.id})) return false
        return run({type:'advance',id:order.id})
      } },
    { hint:['Mutfağı simüle etmek için siparişi hazır işaretleyin.', 'Simulate the kitchen by marking the order ready.'],
      done:d => ['ready','delivered'].includes(orders(d)[0]?.status),
      perform:({d,run}) => !!orders(d)[0] && run({type:'advance',id:orders(d)[0].id}) },
    { hint:['Siparişi teslim edildi olarak işaretleyin.', 'Mark the order delivered.'],
      done:d => orders(d)[0]?.status === 'delivered',
      perform:({d,run}) => !!orders(d)[0] && run({type:'advance',id:orders(d)[0].id}) },
    { hint:['İkinci bir sipariş verin. Açık hesaba yeni kalem eklenecek.', 'Place a second order. The new item will join the open tab.'],
      done:d => orders(d).length > 1, perform:c => addAndSend(c,10) },
    { hint:['Telefondan Hesap iste’ye basıp onaylayın.', 'Request the bill from the phone and confirm.'],
      done:d => tableAt(d,table).status === 'billRequested',
      perform:({run,guest,panel}) => { guest('bill'); panel('cashier'); return run({type:'request',request:'billCall'}) } },
    { hint:['Kasa’da Masa 07 hesabını açın, ödeme yöntemini seçip kapatın.', 'Open Table 07 in Cashier, select a payment method and close the tab.'],
      done:d => has(d,'closeBill'),
      perform:({run,panel}) => { panel('cashier'); return run({type:'pay',table,value:0,method:'card',close:true}) } },
    { hint:['Garson panelinde Masa 07 temizlik görevini üstlenin.', 'In Waiter, claim the Table 07 cleaning task.'],
      done:d => d.tasks.some(task => task.table === table && task.type === 'cleanCall' && task.accepted),
      perform:({d,run,panel,waiter,staff}) => {
        panel('waiter')
        waiter('overview')
        const task = openTasks(d).find(item => item.table === table && item.type === 'cleanCall')
        if (!task) return false
        const index = task.assignee ?? d.staff.findIndex((_,id) => eligible(d,id,task.id))
        if (index < 0) return false
        staff(index)
        return run({type:'claim',id:task.id,staff:index})
      } },
    { hint:['Temizledim’e basın. Masa haritasında Masa 07 yeniden Boş görünecek.', 'Mark the table cleaned. Table 07 will return to Free on the floor map.'],
      done:d => has(d,'cleaned') && tableAt(d,table).status === 'free',
      perform:({d,run}) => {
        const task = openTasks(d).find(item => item.table === table && item.type === 'cleanCall')
        return task?.assignee !== undefined && run({type:'done',id:task.id,staff:task.assignee})
      } },
  ],
  miniMove:[
    { hint:['Masa haritasından aktif Masa 04’ü açın. Hedef olarak Masa 05’i seçip Taşı’ya basın.', 'Open active Table 04 on the map. Choose Table 05 as the target and move it.'],
      done:d => tableAt(d,4).status === 'free' && tableAt(d,5).status === 'active',
      perform:({run,panel,waiter}) => { panel('waiter'); waiter('overview'); return run({type:'move',table:4,target:5}) } },
    { hint:['Masa 05’in detayında sipariş kalemlerinin taşındığını gösterin.', 'Open Table 05 and show that the order items moved with it.'], perform:() => true },
  ],
  miniStock:[
    scan,
    { hint:['Flat White’ı sepete ekleyin.', 'Add a flat white to the cart.'],
      done:d => d.cart.some(line => line.product === 1),
      perform:({run,guest}) => { guest('cart'); return run({type:'add',product:1,options:[]}) } },
    { hint:['Garson → Stok’ta Flat White için Tükendi’ye basın. Telefonda uyarı belirecek.', 'In Waiter → Stock, mark the flat white sold out. A warning appears on the phone.'],
      done:d => d.menu[0].sold,
      perform:({run,guest,panel,waiter}) => { guest('cart'); panel('waiter'); waiter('stock'); return run({type:'stock',id:1}) } },
  ],
}
