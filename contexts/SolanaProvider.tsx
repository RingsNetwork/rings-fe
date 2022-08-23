// import { ConnectionProvider } from './SolanaConnectionProvider' 
// import { WalletProvider } from './SolanaWalletProvider'
import dynamic from "next/dynamic";

const WalletProvider = dynamic(() => import('./SolanaWalletProvider'), { ssr: false });

export default function SolanaProvider({ children = null as any }) {
  return (
    // <ConnectionProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    // </ConnectionProvider>
  )
}