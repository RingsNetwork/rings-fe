import { ChakraProvider } from '@chakra-ui/react'

import Web3Provider from '../contexts/Web3Provider'
import RingsProvider from '../contexts/RingsProvider'
import { SolanaProvider } from '../contexts/SolanaProvider'
import MultiWeb3Provider from '../contexts/MultiWeb3Provider'

import theme from '../theme'

import '../styles/globals.css'

import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Web3Provider>
        <SolanaProvider>
          <MultiWeb3Provider>
            <RingsProvider>
              <Component {...pageProps} />
            </RingsProvider>
          </MultiWeb3Provider>
        </SolanaProvider>
      </Web3Provider>
    </ChakraProvider>
  )
}

export default MyApp
