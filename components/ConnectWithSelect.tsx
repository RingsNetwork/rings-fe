import type { Web3ReactHooks } from '@web3-react/core'
import type { MetaMask } from '@web3-react/metamask'
import { WalletConnect } from '@web3-react/walletconnect'

export function ConnectWithSelect({
  connector,
  isActivating,
  icon,
  onConnect,
  title
}: {
  connector: MetaMask | WalletConnect
  isActivating: ReturnType<Web3ReactHooks['useIsActivating']>
  icon: React.ReactNode
  onConnect: () => void
  title: string
}) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer'
        }}
        onClick={
          isActivating ? undefined : () => {
            connector.activate()
            onConnect()
          }
        }
      >
       <div className='wallet-icon'>{icon}</div> 
       <div className='wallet-title'>{title}</div>
      </div>
    )
}
