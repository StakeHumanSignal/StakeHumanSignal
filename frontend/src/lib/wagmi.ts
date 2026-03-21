'use client'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'StakeHumanSignal',
  projectId: 'stakesignal2026',
  chains: [base],
  ssr: true,
})
