'use client'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia, base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'StakeHumanSignal',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '8f5121b0e3a44e3b9f2c4a3d6e7f8b1c',
  chains: [baseSepolia, base],
  ssr: true,
})
