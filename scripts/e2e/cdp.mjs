/**
 * A dependency-free Chrome DevTools Protocol driver, using Node's global
 * WebSocket. Enough to drive a real browser for the write paths, where the
 * risk is in React state transitions rather than in data shapes.
 *
 * Needs a dev server and a Chrome started with remote debugging:
 *
 *   npm run dev
 *   google-chrome --headless --remote-debugging-port=9222 \
 *     --no-sandbox --user-data-dir=/tmp/tathva-e2e about:blank
 */
const PORT = process.env.CDP_PORT || 9222

async function target() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('no CDP target')
}

export async function session() {
  const ws = new WebSocket(await target())
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

  let id = 0
  const pending = new Map()
  const events = []

  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result)
    } else if (msg.method) {
      events.push(msg)
    }
  }

  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const myId = ++id
      pending.set(myId, { res, rej })
      ws.send(JSON.stringify({ id: myId, method, params }))
    })

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails) {
      throw new Error('page threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails))
    }
    return r.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Console.enable')

  const goto = async (url) => {
    await send('Page.navigate', { url })
    for (let i = 0; i < 80; i += 1) {
      await new Promise((r) => setTimeout(r, 150))
      const ready = await evaluate('document.readyState').catch(() => null)
      if (ready === 'complete') return
    }
    throw new Error('navigation timeout: ' + url)
  }

  const pageErrors = () =>
    events
      .filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
      .map((e) => e.params.entry.text)
      .concat(
        events
          .filter((e) => e.method === 'Runtime.exceptionThrown')
          .map((e) => e.params.exceptionDetails.exception?.description || 'exception'),
      )

  return { send, evaluate, goto, pageErrors, close: () => ws.close() }
}
