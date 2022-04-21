import React, { useCallback, useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'

import Modal, { ModalProps } from '../Modal'
import ModalActions from '../ModalActions'
import ModalContent from '../ModalContent'
import ModalTitle from '../ModalTitle'

import WalletConnectCard from '../connectors/WalletConnectCard'
import MetaMaskCard from '../connectors/MetaMaskCard'

const WalletProviderModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const { account } = useWeb3React()

  useEffect(
    () => {
      if (account && onDismiss) {
        onDismiss()
      }
    },
    [account, onDismiss]
  )

  const handleConnect = useCallback(
    () => {
      if (onDismiss) {
        onDismiss()
      }
    },
    [onDismiss]
  )

  return (
    <Modal>
      <ModalTitle text="Select a wallet provider" />

      <ModalContent>
        <MetaMaskCard onConnect={handleConnect} />
        <div className="spacer" />
        <WalletConnectCard onConnect={handleConnect} />
      </ModalContent>

      <ModalActions>
        <div onClick={onDismiss}>Cancel</div>
      </ModalActions>
    </Modal>
  )
}

export default WalletProviderModal
