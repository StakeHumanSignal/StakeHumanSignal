'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export function WalletDisplay() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            className="bg-primary-container text-on-primary-container px-4 py-2 font-[family-name:var(--font-headline)] text-xs font-bold uppercase transition-all hover:brightness-110 active:scale-95"
          >
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
    )
  }

  return <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
}
