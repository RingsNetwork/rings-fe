import { useEffect } from 'react'
import Image from 'next/image'

import walletConnectLogo from '../../assets/img/wallet-connect.svg'
import { hooks, walletConnect } from '../../connectors/walletConnect'
import { ConnectWithSelect } from '../ConnectWithSelect'

const {
  useChainId,
  useAccounts,
  useError,
  useIsActivating,
  useIsActive,
  useProvider,
  useENSNames
} = hooks

export default function WalletConnectCard({
  onConnect
}: {
  onConnect: () => void
}){
  const chainId = useChainId()
  const accounts = useAccounts()
  const error = useError()
  const isActivating = useIsActivating()

  const isActive = useIsActive()

  const provider = useProvider()
  const ENSNames = useENSNames(provider)

  // attempt to connect eagerly on mount
  // useEffect(() => {
  //   void walletConnect.connectEagerly()
  // }, [])

  return (
    <div>
      <ConnectWithSelect
        connector={walletConnect}
        isActivating={isActivating}
        icon={<Image alt="" src={walletConnectLogo} width={32} height={32} />}
        onConnect={onConnect}
        title="WalletConnect"
      />
    </div>
  )
}
