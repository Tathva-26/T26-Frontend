import styles from './Expo.module.css'

// Code-built facets remain available when WebGL or motion is disabled.
export default function FallbackShards() {
  return <svg className={styles.fallbackShards} data-expo-fallback-shards viewBox='0 0 1413 697' preserveAspectRatio='none' aria-hidden='true'>
    <defs>
      <linearGradient id='expo-shard-light'><stop stopColor='#85b9ed' /><stop offset='.6' stopColor='#314574' /><stop offset='1' stopColor='#d091e8' /></linearGradient>
      <g id='expo-shard'><path d='M0 -35L15 -12L10 24L-7 36L-15 5Z' fill='url(#expo-shard-light)' stroke='#b8c8ed' strokeWidth='.8' /><path d='M0 -35L-2 5L-7 36M-15 5L-2 5L15 -12M-2 5L10 24' fill='none' stroke='#a6b5e0' strokeWidth='.6' /></g>
    </defs>
    <use href='#expo-shard' transform='translate(499 315) rotate(38)' />
    <use href='#expo-shard' transform='translate(457 433) rotate(38) scale(.65)' />
    <use href='#expo-shard' transform='translate(893 285) rotate(38) scale(.65)' />
    <use href='#expo-shard' transform='translate(942 486) rotate(38) scale(.85)' />
    <use href='#expo-shard' transform='translate(1042 485) rotate(38) scale(1.5)' />
    <use href='#expo-shard' transform='translate(620 619) rotate(38) scale(.65)' />
  </svg>
}
