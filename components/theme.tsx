import {
  Box,
  Flex,
  useColorMode,
  useColorModeValue,
  Text,
  Button,
  Center,
} from '@chakra-ui/react'
import { FaMoon, FaSun } from 'react-icons/fa'

const ThemeToogle = () => {
  const { toggleColorMode: toggleMode } = useColorMode()
  const text = useColorModeValue('dark', 'light')
  const SwitchIcon = useColorModeValue(FaMoon, FaSun)

  return (
    <Center>
    <Button onClick={toggleMode}>
      <Center>
        <Flex 
          alignItems='center'
        >
            <Box mr="2">
              <SwitchIcon />
            </Box>
            <Text>{text.toUpperCase()} MODE</Text>
        </Flex>
      </Center>
    </Button>
    </Center>
  )
}

export default ThemeToogle
