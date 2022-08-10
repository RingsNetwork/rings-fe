import React, { useCallback } from 'react'
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Center,
} from '@chakra-ui/react'

import WalletConnectCard from './connectors/WalletConnectCard'
import MetaMaskCard from './connectors/MetaMaskCard'

import { useWallet } from '../contexts/SolanaWalletProvider'

const ConnectWallet: React.FC = () => {
  const { select } = useWallet()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleConnect = useCallback(
    () => {
      onClose()
    },
    [onClose]
  )

  return (
    <Menu>
      <MenuButton as={Button}>
        Connect Wallet
      </MenuButton>
      <MenuList>
        <MenuItem onClick={onOpen}>
          <Center>
            <Box>
              <Box cursor="pointer">Ethereum</Box>
            </Box>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
              <ModalOverlay />

              <ModalContent>
                <ModalHeader>
                  <Text fontSize="14px">Select a wallet provider</Text>
                </ModalHeader>

                <ModalBody>
                  <MetaMaskCard onConnect={handleConnect} />
                  <WalletConnectCard onConnect={handleConnect} />
                </ModalBody>

                <ModalFooter>
                  <ModalCloseButton onClick={onClose} />
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Center>
        </MenuItem>
        <MenuItem onClick={select}>
          <Box>Solana</Box>
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default ConnectWallet