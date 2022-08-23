import React, { useState, useEffect, useCallback, createContext, useContext, useReducer, useRef } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import useMultiWeb3 from '../hooks/useMultiWeb3'
import useBNS from '../hooks/useBNS'

import formatAddress from '../utils/formatAddress'
import { ADDRESS_TYPE } from '../utils/const'
import { getAddressWithType } from '../utils'

export interface OnlinePeer {
  address: string,
  name: string,
  ens: string,
  bns: string,
  status: string,
  type: ADDRESS_TYPE
}

interface OnlinerMapProps {
  [key: string]: OnlinePeer,
}

const reducer = (state: OnlinerMapProps, { type, payload }: { type: string, payload: any }) => {
  console.log(`websocket reducer`, type, payload)
  switch (type) {
    case 'join': {
      const { peer: { id } } = payload
      const { address, type } = getAddressWithType(id)

      return {
        ...state,
        [address]: {
          address,
          name: formatAddress(address),
          ens: '',
          bns: '',
          status: '',
          type
        }
      }
    }
    case 'leave': {
      const { peer: { id } } = payload
      const { address } = getAddressWithType(id)

      delete state[address]

      return state
    }
    case 'connected': {
      const { peers } = payload

      return peers.reduce((prev: OnlinerMapProps, { id: peer }: {id: string, type: string}) => {
        const { address, type } = getAddressWithType(peer)

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
    }
    case 'changeStatus': {
      const { peer, status } = payload
      const { address } = getAddressWithType(peer)

      if (!state[address]) {
        return state
      }

      return {
        ...state,
        [address]: {
          ...state[address],
          status,
        }
      }
    }
    case 'changeName': {
      const { peer, key, name } = payload
      const { address } = getAddressWithType(peer)

      return {
        ...state,
        [address]: {
          ...state[address],
          [key]: name,
        }
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
  changeStatus: (peer: string, status: string) => void
}

export const WebsocketContext = createContext<WebsocketContextProps>({
  state: {} as OnlinerMapProps,
  dispatch: () => {},
  sendMessage: () => {},
  changeStatus: () => {},
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
        did: { id: account, type: addressType === ADDRESS_TYPE.ED25519 ? 'ED25519' : 'DEFAULT' },
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
        dispatch({ type: 'leave', payload: { peer: did } })
      } else if (data.list) {
        // on connect or reconnect
        dispatch({ type: 'connected', payload: { peers: data.list } })
      }
    }
  }, [lastJsonMessage])

  const changeStatus = useCallback((peer: string, status: string) => {
    dispatch({ type: 'changeStatus', payload: { peer, status } })
  }, [dispatch])

  return <WebsocketContext.Provider value={{
    state,
    dispatch,
    sendMessage,
    changeStatus,
  }}>
    {children}
  </WebsocketContext.Provider>
}

export default WebsocketProvider