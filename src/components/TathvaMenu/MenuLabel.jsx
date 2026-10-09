'use client'

import { Michroma } from 'next/font/google'

const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

/* The current page/section name shown inside the center trigger strip.
   Pulled out of TathvaMenu so the text itself (font, sizing, position)
   can be tuned per page without touching the trigger/panel logic. */
export default function MenuLabel({ text }) {
  return (
    <span
      className={`${michroma.className} pointer-events-none absolute inset-0 flex select-none items-center justify-center text-[9px] leading-none tracking-[3px] text-white -translate-y-[5px] transition-all duration-200`}
    >
      {text}
    </span>
  )
}
