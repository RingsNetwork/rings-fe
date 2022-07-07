import React, { useCallback, useState } from 'react'
import { 
  Input,
  Box, 
  Button, 
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
} from '@chakra-ui/react'

import useRings from '../hooks/useRings';

const AddressModal: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { connectByAddress, fetchPeers } = useRings()
  const [address, setAddress] = useState<string>('')

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  const handleConnectByAddress = useCallback(async () => {
    if (address) {
      await connectByAddress(address)
      onClose()
      fetchPeers()
    }
  }, [address, fetchPeers, onClose, connectByAddress])

  return (
    <>
      <Box onClick={onOpen}>Connect by address</Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />

        <ModalContent>
          <ModalHeader>
            <Text fontSize="14px">Connect by Address</Text>
          </ModalHeader>

          <ModalBody>
            <Box>
              <Box>
                <Input type="text" placeholder='Type Address' value={address} onChange={handleInputChange} />
              </Box>
              <Flex justifyContent="flex-end" pt="20px">
                <Button mr="15px" onClick={onClose}>Cancel</Button>
                <Button onClick={handleConnectByAddress}>Connect</Button>
              </Flex>
            </Box>
          </ModalBody>

          <ModalFooter>
            <ModalCloseButton onClick={onClose} />
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AddressModal

