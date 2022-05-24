import { useEffect } from 'react'
import Image from 'next/image'

import metamaskLogo from '../../assets/img/metamask-fox.svg'

import { hooks, metaMask } from '../../connectors/metaMask'
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

export default function MetaMaskCard({ onConnect }: { onConnect: () => void }){
  const isActivating = useIsActivating()

  // attempt to connect eagerly on mount
  // useEffect(() => {
  // void metaMask.connectEagerly()
  // }, [])

  return (
    <div>
      <ConnectWithSelect
        connector={metaMask}
        isActivating={isActivating}
        icon={<Image alt="Icon" src={metamaskLogo} width={32} height={32} />}
        onConnect={onConnect}
        title="Metamask"
      />
    </div>
  )
}
