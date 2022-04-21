import React, { useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'

import useModal from '../hooks/useModal'
import WalletProviderModal from './WalletModal'

import formatAddress from '../utils/formatAddress'

interface AccountButtonProps {}

const AccountButton: React.FC<AccountButtonProps> = (props) => {
  const [onPresentWalletProviderModal] = useModal(
    <WalletProviderModal />,
    'provider'
  )

  const { account } = useWeb3React()

  const handleUnlockClick = useCallback(
    () => {
      onPresentWalletProviderModal()
    },
    [onPresentWalletProviderModal]
  )

  return (
    <div>
      {!account ? (
        <div onClick={handleUnlockClick}>Connect Wallet</div>
      ) : (
        <div>{formatAddress(account)}</div>
      )}
    </div>
  )
}

export default AccountButton
