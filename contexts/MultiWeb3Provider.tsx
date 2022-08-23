import { useState, useEffect, createContext, useContext } from 'react'

import { useWeb3React } from '@web3-react/core'
import web3 from "web3";

import { UnsignedInfo } from '@ringsnetwork/rings-node'

import { useWallet } from '../contexts/SolanaWalletProvider'
import useENS from '../hooks/useENS';
import formatAddress from '../utils/formatAddress';
import { ADDRESS_TYPE } from '../utils/const';

interface MultiWeb3Context {
  account: string,
  accountName: string,
  signature: Uint8Array | null,
  chain: string,
  unsignedInfo: UnsignedInfo | null,
  provider: any,
  addressType: ADDRESS_TYPE
}

export const MultiWeb3Context = createContext<MultiWeb3Context>({
  account: '',
  accountName: '',
  signature: null,
  chain: '',
  unsignedInfo: null,
  provider: null,
  addressType: ADDRESS_TYPE.DEFAULT
})

export const useMultiWeb3 = () => useContext(MultiWeb3Context)

const MultiWeb3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account: ethereumAccount, provider } = useWeb3React()
  const { wallet, connected } = useWallet()
  const name = useENS()

  const [account, setAccount] = useState('')
  const [chain, setChain] = useState('')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [unsignedInfo, setUnsignedInfo] = useState<UnsignedInfo | null>(null)
  const [accountName, setAccountName] = useState('')
  const [addressType, setAddressType] = useState(ADDRESS_TYPE.DEFAULT)

  useEffect(() => {
    if (ethereumAccount && name) {
      setAccountName(name)
    }
  }, [name, ethereumAccount])

  useEffect(() => {
    console.group('multi')
      console.log(`ethereumAccount:`, ethereumAccount);
      console.log(`connected`, connected)
      console.log(`wallet`, wallet?.publicKey?.toBase58())
    console.groupEnd()
    if (ethereumAccount && provider) {
      console.log(`ethereumAccount:`, ethereumAccount);
      setChain('ethereum')
      setAccount(ethereumAccount.toLowerCase())

      const getEthereumSignature = async () => {
        // const unsignedInfo = UnsignedInfo.new_with_signer(ethereumAccount, SignerMode.EIP712);
        const unsignedInfo = new UnsignedInfo(ethereumAccount);
        // @ts-ignore
        const signer = provider.getSigner(ethereumAccount);
        const signed = await signer.signMessage(unsignedInfo.auth);
        const signature = new Uint8Array(web3.utils.hexToBytes(signed));
  
        setUnsignedInfo(unsignedInfo)
        setSignature(signature)
      }

      getEthereumSignature()
    } else if (connected && wallet && wallet.publicKey) {
      const pubKey = wallet.publicKey.toBase58()
      console.log(`wallet`, pubKey)
      setChain('solana')
      setAccount(pubKey)
      setAccountName(formatAddress(pubKey))
      setAddressType(ADDRESS_TYPE.ED25519)

      const getSolanaSignature = async () => {
        const unsignedInfo = UnsignedInfo.new_with_address(pubKey, ADDRESS_TYPE.ED25519);
        const data = new TextEncoder().encode(unsignedInfo.auth);
        const signature = await wallet.signMessage(data, 'utf8');
  
        setUnsignedInfo(unsignedInfo)
        setSignature(signature)
      }

      getSolanaSignature()
    } else {
      setChain('')
      setAccount('')
      setSignature(null)
      setAddressType(ADDRESS_TYPE.DEFAULT)
    }
  }, [ethereumAccount, wallet, connected, provider])


  return (
    <MultiWeb3Context.Provider
      value={{
        account,
        accountName,
        signature,
        chain,
        unsignedInfo,
        provider,
        addressType
      }}
    >
      { children }
    </MultiWeb3Context.Provider>
  )
}

export default MultiWeb3Provider