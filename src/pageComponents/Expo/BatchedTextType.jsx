'use client'

import { createElement, useEffect, useState } from 'react'
import './TextType.css'

export default function BatchedTextType({ text, as: Component = 'div', typingSpeed = 5, initialDelay = 0, start = true, instant = false, showCursor = true, cursorCharacter = '|', className = '', loop: _loop, ...props }) {
  const content = Array.isArray(text) ? text.join('\n') : text
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start || instant) return
    let frame, origin
    let previous = 0
    const tick = now => {
      origin ??= now
      const next = Math.min(content.length, Math.max(0, Math.floor((now - origin - initialDelay) / Math.max(1, typingSpeed))))
      if (next !== previous) { previous = next; setCount(next) }
      if (next < content.length) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [content, typingSpeed, initialDelay, start, instant])
  return createElement(Component, { className: `text-type ${className}`, ...props },
    <span className='text-type__content'>{instant ? content : content.slice(0, count)}</span>,
    showCursor && start && !instant && count < content.length && <span className='text-type__cursor text-type__cursor--batched' aria-hidden='true'>{cursorCharacter}</span>)
}
