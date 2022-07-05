import React, { useCallback, useState } from 'react'

import Modal, { ModalProps } from '../Modal'
import ModalActions from '../ModalActions'
import ModalContent from '../ModalContent'
import ModalTitle from '../ModalTitle'

import useRings from '../../hooks/useRings';

import styles from './index.module.scss'

const AddressModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const { connectByAddress, fetchPeers } = useRings()
  const [address, setAddress] = useState<string>('')

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  const handleConnectByAddress = useCallback(async () => {
    if (address) {
      await connectByAddress(address)

      fetchPeers()

      if (onDismiss) {
        onDismiss()
      }
    }
  }, [address, fetchPeers, onDismiss, connectByAddress])

  return (
    <Modal>
      <ModalTitle text="" />

      <ModalContent>
        <div className={styles['modal-address']}>
          <div className='bd'>
            <input className='input-text' type="text" placeholder='Type Address' value={address} onChange={handleInputChange} />
          </div>
          <div className='ft'>
            <div className='btn-connect' onClick={handleConnectByAddress}>Connect</div>
          </div>
        </div>
      </ModalContent>

      <ModalActions>
      </ModalActions>
    </Modal>
  )
}

export default AddressModal

