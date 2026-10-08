import {
  Alata,
  Alatsi,
  Bebas_Neue,
  Bowlby_One_SC,
  Hammersmith_One,
  Instrument_Serif,
  Jaro,
  Jockey_One,
  Jost,
  La_Belle_Aurore,
  Orbitron,
  Oswald,
  Space_Grotesk,
  Squada_One,
  Syne,
} from 'next/font/google'

// All Google Fonts are fetched ONCE at build time and served same-origin
// from Vercel (`/_next/static/...`). Browsers never contact Google at
// runtime.
//
// NOTE: next/font requires inline, statically-analyzable options — do not
// refactor these calls to use shared/spread option objects.

export const bebasNeue = Bebas_Neue({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-bebas' })
export const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space' })
export const jockeyOne = Jockey_One({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-jockey' })
export const orbitron = Orbitron({ subsets: ['latin'], display: 'swap', variable: '--font-orbitron' })
export const squadaOne = Squada_One({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-squada' })
export const alatsi = Alatsi({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-alatsi' })
export const hammersmithOne = Hammersmith_One({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-hammersmith' })
export const instrumentSerif = Instrument_Serif({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-instrument' })
export const oswald = Oswald({ subsets: ['latin'], display: 'swap', variable: '--font-oswald' })
export const syne = Syne({ subsets: ['latin'], display: 'swap', variable: '--font-syne' })
export const jaro = Jaro({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-jaro' })
export const jost = Jost({ subsets: ['latin'], display: 'swap', variable: '--font-jost' })
export const laBelleAurore = La_Belle_Aurore({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-aurore' })
export const alata = Alata({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-alata' })
export const bowlbyOneSC = Bowlby_One_SC({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-bowlby' })

export const siteFontVariables = [
  bebasNeue.variable,
  spaceGrotesk.variable,
  jockeyOne.variable,
  orbitron.variable,
  squadaOne.variable,
  alatsi.variable,
  hammersmithOne.variable,
  instrumentSerif.variable,
  oswald.variable,
  syne.variable,
  jaro.variable,
  jost.variable,
  laBelleAurore.variable,
  alata.variable,
  bowlbyOneSC.variable,
].join(' ')
