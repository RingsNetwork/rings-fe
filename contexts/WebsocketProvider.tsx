import React, { useState, useEffect, useCallback, createContext, useContext, useReducer, useRef } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { AddressType } from '@ringsnetwork/rings-node'

import useMultiWeb3 from '../hooks/useMultiWeb3'
import useBNS from '../hooks/useBNS'

import formatAddress from '../utils/formatAddress'

interface OnlinerMapProps {
  [key: string]: {
    address: string,
    name: string,
    ens: string,
    bns: string,
    status: string
  },
}

const reducer = (state: OnlinerMapProps, { type, payload }: { type: string, payload: any }) => {
  console.log(`websocket reducer`, type, payload)
  switch (type) {
    case 'join':
      const { peer: { id, type} } = payload
      const address = type === 'DEFAULT' ? id.toLowerCase() : id

      return {
        ...state,
        [address]: {
          address,
          name: formatAddress(id),
          ens: '',
          bns: '',
          status: '',
          type
        }
      }
    case 'leave':
      delete state[payload.peer]

      return state
    case 'connected':
      const { peers } = payload

      return peers.reduce((prev: OnlinerMapProps, { id: peer, type }: {id: string, type: string}) => {
        // eth: DEFAULT
        // solana: ED25519
        const address = type === 'DEFAULT' ? peer.toLowerCase() : peer

        return {
          ...prev,
          [address]: {
            address,
            name: formatAddress(address),
            ens: '',
            bns: '',
            status: '',
            type,
          }
        }
      }, {})
    case 'changeStatus':
      return {
        ...state,
        [payload.peer]: {
          ...state[payload.peer],
          status: payload.status,
        }
      }
    case 'changeName':
      return {
        ...state,
        [payload.peer]: {
          ...state[payload.peer],
          [payload.key]: payload.name,
        }
      }
    default:
      return state
  }
}

interface WebsocketContextProps {
  state: OnlinerMapProps,
  dispatch: React.Dispatch<any>,
  sendMessage: (status: 'join' | 'leave') => void
}

export const WebsocketContext = createContext<WebsocketContextProps>({
  state: {} as OnlinerMapProps,
  dispatch: () => {},
  sendMessage: () => {}
})

export const usePublicPeers = () => useContext(WebsocketContext)

const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const didUnmount = useRef(false)

  const { account, provider, addressType } = useMultiWeb3()
  const { getBNS } = useBNS()
  const [socketUrl, setSocketUrl] = useState('wss://api-did-dev.ringsnetwork.io/ws');

  const [state, dispatch] = useReducer(reducer, {})

  const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(
    socketUrl,
    {
      shouldReconnect: (closeEvent) => didUnmount.current === false,
      retryOnError: true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  const resolveBNS = useCallback(async (peers: string[]) => {
    if (getBNS) {
      peers.forEach(async (address) => {
        const bns = await getBNS(address)

        if (bns) {
          dispatch({ type: 'changeName', payload: { peer: address, key: 'bns', name: bns } })
        }
      })
    }
  }, [getBNS])

  const resolveENS = useCallback(async (peers: string[]) => {
    if (provider) {
      peers.forEach(async (address) => {
        const ens = await provider.lookupAddress(address)

        if (ens) {
          const _address = await provider.resolveName(ens)

          if (_address && address === _address.toLowerCase()) {
            dispatch({ type: 'changeName', payload: { peer: address, key: 'ens', name: ens } })
          }
        }
      })
    }
  }, [provider])

  useEffect(() => {
    resolveBNS(Object.keys(state).filter((address) => address.startsWith(`0x`) && state[address] && !state[address].bns))
    resolveENS(Object.keys(state).filter((address) => address.startsWith(`0x`) && state[address] && !state[address].ens))
  }, [resolveENS, resolveBNS, state])

  const sendMessage = useCallback((status: 'join' | 'leave') => {
    console.group(`change status`)
    console.log(`time`, new Date().toLocaleTimeString())
    console.log(`status: ${status}`)
    console.log(`account: ${account}`)
    console.log(`readyState`, readyState)
    console.groupEnd()
    if (readyState === ReadyState.OPEN && account) {
      sendJsonMessage({
        did: { id: account, type: addressType === AddressType.DEFAULT ? 'DEFAULT' : 'ED25519' },
        timestamp: Date.now(),
        data: status
      })
    }
  }, [
    readyState,
    account,
    sendJsonMessage,
    addressType,
  ])

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, [])

  useEffect(() => {
    if (lastJsonMessage) {
      // @ts-ignore
      const { did, data } = lastJsonMessage

      if (data === 'join') {
        dispatch({ type: 'join', payload: { peer: did } })
      } else if (data === 'leave') {
        dispatch({ type: 'leave', payload: { peer: did.id } })
      } else if (data.list) {
        // on connect or reconnect
        dispatch({ type: 'connected', payload: { peers: data.list } })
      }
    }
  }, [lastJsonMessage])

  return <WebsocketContext.Provider value={{
    state,
    dispatch,
    sendMessage,
  }}>
    {children}
  </WebsocketContext.Provider>
}

export default WebsocketProvider