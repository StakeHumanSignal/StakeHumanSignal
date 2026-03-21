'use client'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'StakeHumanSignal',
  projectId: 'stakesignal2026',
  chains: [baseSepolia],
  ssr: true,
})
