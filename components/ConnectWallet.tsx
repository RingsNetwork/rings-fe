import { useState } from 'react'
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  Box,
} from '@chakra-ui/react'

import AccountButton from './AccountButton'
import { useWallet } from '../contexts/SolanaWalletProvider'

const ConnectWallet: React.FC = () => {
  const { select } = useWallet()

  return (
    <Menu>
      <MenuButton as={Button}>
        Connect Wallet
      </MenuButton>
      <MenuList>
        <MenuItem><AccountButton /></MenuItem>
        <MenuItem>
          <Box onClick={select}>Solana</Box>
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default ConnectWallet