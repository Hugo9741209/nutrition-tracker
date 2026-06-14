import { useState, useEffect } from 'react'

// Suivi budget courses (localStorage). Alimenté à chaque import de ticket Drive.
// Order : { id, date (ISO yyyy-mm-dd), total (number), count }
const LS_KEY = 'nutritrack_budget'

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

const todayISO = () => new Date().toISOString().split('T')[0]

export function useBudget() {
  const [orders, setOrders] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(orders)) } catch { /* ignore */ }
  }, [orders])

  function addOrder({ total, count }) {
    if (!total) return
    setOrders((o) => [...o, { id: crypto.randomUUID(), date: todayISO(), total, count: count ?? 0 }])
  }
  function clear() { setOrders([]) }

  const month = todayISO().slice(0, 7)
  const monthTotal = orders.filter((o) => o.date.startsWith(month)).reduce((s, o) => s + o.total, 0)
  const lastOrder = orders[orders.length - 1] ?? null

  return { orders, addOrder, clear, monthTotal, lastOrder }
}
