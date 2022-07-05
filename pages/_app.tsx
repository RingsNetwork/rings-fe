import ModalsProvider from '../contexts/Modals'
import Web3Provider from '../contexts/Web3Provider'
import RingsProvider from '../contexts/RingsProvider'

import '../styles/globals.css'

import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <RingsProvider>
        <ModalsProvider>
            <Component {...pageProps} />
        </ModalsProvider>
      </RingsProvider>
    </Web3Provider>
  )
}

export default MyApp
