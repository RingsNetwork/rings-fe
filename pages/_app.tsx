import ModalsProvider from '../contexts/Modals'
import Web3Provider from '../contexts/Web3Provider'

import '../styles/globals.css'

import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <ModalsProvider>
        <Component {...pageProps} />
      </ModalsProvider>
    </Web3Provider>
  )
}

export default MyApp
