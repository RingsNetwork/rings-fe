import { useState, useEffect, useCallback, createContext, useContext } from 'react'

import { useWeb3React } from '@web3-react/core'
import web3 from "web3";

import { UnsignedInfo, AddressType, SignerMode, get_address } from '@ringsnetwork/rings-node'

import { useWallet } from '../contexts/SolanaWalletProvider'
import { useUnisatWallet } from '../contexts/UnisatWalletProvider'
import useENS from '../hooks/useENS';
import formatAddress from '../utils/formatAddress';

interface MultiWeb3Context {
  account: string,
  accountName: string,
  signature: Uint8Array | null,
  chain: string,
  unsignedInfo: UnsignedInfo | null,
  provider: any,
  addressType: AddressType
}

export const MultiWeb3Context = createContext<MultiWeb3Context>({
  account: '',
  accountName: '',
  signature: null,
  chain: '',
  unsignedInfo: null,
  provider: null,
  addressType: AddressType.DEFAULT
})

export const useMultiWeb3 = () => useContext(MultiWeb3Context)

const MultiWeb3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account: ethereumAccount, provider } = useWeb3React()
  const { wallet, connected } = useWallet()
  const { wallet: unisatWallet, account: unisatAccount, pubKey: unisatPubKey, connected: unisatConnected } = useUnisatWallet()
  const name = useENS()

  const [account, setAccount] = useState('')
  const [chain, setChain] = useState('')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [unsignedInfo, setUnsignedInfo] = useState<UnsignedInfo | null>(null)
  const [accountName, setAccountName] = useState('')
  const [addressType, setAddressType] = useState(AddressType.DEFAULT)

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
      console.log(`unisatAccount`, unisatAccount)
      console.log(`unisatPubKey`, unisatPubKey)
      console.log(`unisatConnected`, unisatConnected)
    console.groupEnd()
    if (ethereumAccount && provider) {
      console.log(`ethereumAccount:`, ethereumAccount);
      setChain('ethereum')
      setAccount(ethereumAccount)
      setAddressType(AddressType.DEFAULT)

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
      console.log(`pubKey`, pubKey)
      const account = `0x${get_address(pubKey, AddressType.ED25519)}`
      console.log(account)
      setAccount(account)
      setAccountName(formatAddress(account))
      // setAccount(pubKey)
      // setAccountName(formatAddress(pubKey))
      setAddressType(AddressType.ED25519)

      const getSolanaSignature = async () => {
        const unsignedInfo = UnsignedInfo.new_with_address(pubKey, AddressType.ED25519);
        const data = new TextEncoder().encode(unsignedInfo.auth);
        const signature = await wallet.signMessage(data, 'utf8');
  
        setUnsignedInfo(unsignedInfo)
        setSignature(signature)
      }

      getSolanaSignature()
    } else if (unisatConnected && unisatPubKey) {
      console.group('bitcoin')
      setChain('bitcoin')
      console.log(`unisatAccount`, unisatAccount)
      setAccount(unisatAccount)
      setAccountName(formatAddress(unisatAccount))
      setAddressType(AddressType.DEFAULT)

      const getUnisatSignature = async () => {
        const unsignedInfo = UnsignedInfo.new_with_pubkey(unisatPubKey, SignerMode.BIP137)
        const signed = await unisatWallet.signMessage(unsignedInfo.auth)
        const signature = new Uint8Array(atob(signed).split('').map(c => c.charCodeAt(0)))
  
        setUnsignedInfo(unsignedInfo)
        setSignature(signature)
      }

      getUnisatSignature()
    } else {
      setChain('')
      setAccount('')
      setSignature(null)
      setAddressType(AddressType.DEFAULT)
    }
  }, [ethereumAccount, wallet, connected, provider, unisatAccount, unisatConnected, unisatPubKey, unisatWallet])

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