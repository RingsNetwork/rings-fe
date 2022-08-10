import { ConnectionProvider } from './SolanaConnectionProvider' 
import { WalletProvider } from './SolanaWalletProvider'

export function SolanaProvider({ children = null as any }) {
  return (
    <ConnectionProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}