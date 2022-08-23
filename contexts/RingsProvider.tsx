import { useEffect, useState, useCallback, createContext, useContext, useReducer } from 'react'

import init, { Client, Peer as NodePeer, MessageCallbackInstance, debug, AddressType } from '@ringsnetwork/rings-node'

import useMultiWeb3 from '../hooks/useMultiWeb3'
import useBNS from '../hooks/useBNS';
import useWebsocket from '../hooks/useWebsocket'

import formatAddress from '../utils/formatAddress';
import { getAddressWithType } from '../utils';

import { ADDRESS_TYPE } from '../utils/const';
import { OnlinePeer } from './WebsocketProvider';

export interface Chat_props {
  from: string,
  to: string,
  message: string
}

interface RingsContext {
  client: Client | null,
  fetchPeers: () => Promise<void>,
  sendMessage: (to: string, message: string) => Promise<void>,
  connectByAddress: (address: string) => Promise<void>,
  createOffer: () => Promise<void>,
  answerOffer: (offer: any) => Promise<void>,
  acceptAnswer: (transportId: any, answer: any) => Promise<void>,
  turnUrl: string,
  setTurnUrl: (turnUrl: string) => void,
  nodeUrl: string,
  setNodeUrl: (nodeUrl: string) => void,
  status: string,
  setStatus: (status: string) => void,
  disconnect: () => void,
  state: StateProps,
  dispatch: React.Dispatch<any>,
  startChat: (peer: string) => void,
  endChat: (peer: string) => void,
}

export interface Peer {
    address: string,
    state: string | undefined,
    transport_id: string,
    name: string,
    bns: string,
    ens: string,
    type: ADDRESS_TYPE,
}
interface PeerMapProps {
  [key: string]: Peer
}

export const RingsContext = createContext<RingsContext>({
  client: null,
  fetchPeers: async () => {},
  sendMessage: async () => {},
  connectByAddress: async () => {},
  createOffer: async () => {},
  answerOffer: async () => {},
  acceptAnswer: async () => {},
  turnUrl: '',
  setTurnUrl: () => {},
  nodeUrl: '',
  setNodeUrl: () => {},
  status: 'disconnected',
  setStatus: () => {},
  disconnect: () => {},
  state: {peerMap: {}, chatMap: {}, activePeers: [], activePeer: ''} as StateProps,
  dispatch: () => {},
  startChat: () => {},
  endChat: () => {},
})

export const useRings = () => useContext(RingsContext)

interface ChatMapProps {
  [key: string]: {
    messages: Chat_props[],
    status: string,
  }
}

interface StateProps {
  peerMap: PeerMapProps,
  chatMap: ChatMapProps,
  activePeers: string[],
  activePeer: string,
}

const FETCH_PEERS = 'FETCH_PEERS'
const CHANGE_NAME = 'CHANGE_NAME'
const RECEIVE_MESSAGE = 'RECEIVE_MESSAGE'
const ACTIVE_CHAT = 'ACTIVE_CHAT'
const END_CHAT = 'END_CHAT'

const reducer = (state: StateProps, { type, payload }: { type: string, payload: any } ) => {
  console.log('reducer', type, payload)
  switch (type) {
    case FETCH_PEERS:
      const peerMap = state.peerMap
      const chatMap = state.chatMap

      const keys = Object.keys(state.peerMap)
      const disconnectedPeers = keys.filter(key => !payload.peers.includes(key))

      disconnectedPeers.forEach((address: string) => {
        peerMap[address] = {
          ...peerMap[address],
          state: 'disconnected',
        }
      })

      payload.peers.forEach(({ address, transport_addr, ...rest }: NodePeer) => {
        const { type, address: _address} = getAddressWithType(transport_addr.startsWith('1') ? transport_addr.replace(/^1/, '') : address)

        if (!state.peerMap[_address]) {
            peerMap[_address] = {
              ...rest,
              address: _address,
              name: formatAddress(_address),
              bns: '',
              ens: '',
              type,
            }

            chatMap[_address] = {
              messages: [],
              status: ''
            }
        } else {
          peerMap[_address] = {
            ...state.peerMap[_address],
            ...rest,
          }
        }
      })

      return {
        ...state,
        peerMap,
        chatMap
      }
    case CHANGE_NAME:
      return {
        ...state,
        peerMap: {
          ...state.peerMap,
          [payload.peer]: {
            ...state.peerMap[payload.peer],
            [payload.key]: payload.name,
          }
        }
      }
    case ACTIVE_CHAT:
      return {
        ...state,
        chatMap: {
          ...state.chatMap,
          [payload.peer]: {
            ...state.chatMap[payload.peer],
            status: 'read',
          }
        },
        activePeer: payload.peer,
        activePeers: !state.activePeers.includes(payload.peer) ? [...state.activePeers, payload.peer] : state.activePeers
      }
    case END_CHAT:
      const activePeers = state.activePeers.filter(peer => peer !== payload.peer)

      return {
        ...state,
        chatMap: {
          ...state.chatMap,
          [payload.peer]: {
            ...state.chatMap[payload.peer],
            status: 'read',
          }
        },
        activePeer: activePeers.length ? activePeers[activePeers.length - 1] : '',
        activePeers
      }
    case RECEIVE_MESSAGE:
      const { address } = getAddressWithType(payload.peer)

      return {
        ...state,
        chatMap: {
          ...state.chatMap,
          [address]: {
            messages: state.chatMap[address] ? [...state.chatMap[address].messages, payload.message] : [payload.message],
            status: state.activePeer === address ? 'read' : 'unread',
          }
        },
      }
    default: 
      return state
  }
}

const RingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getBNS } = useBNS()
  const { account, unsignedInfo, signature, provider, addressType } = useMultiWeb3()
  const { dispatch: onlinerDispatch } = useWebsocket()

  const [turnUrl, setTurnUrl] = useState('')
  const [nodeUrl, setNodeUrl] = useState('')

  const [status, setStatus] = useState<string>('disconnected')

  const [client, setClient] = useState<Client | null>(null)
  const [wasm, setWasm] = useState<any>(null)

  const [state, dispatch] = useReducer(reducer, { peerMap: {}, chatMap: {}, activePeers: [], activePeer: '' }) 

  const fetchPeers = useCallback(async () => {
    if (client && status === 'connected') {
      const peers = await client.list_peers()

      dispatch({ type: FETCH_PEERS, payload: { peers } })

      peers.forEach(( { address, state: status }: NodePeer) => {
        const { address: peer, type} = getAddressWithType(address)

        onlinerDispatch({ type: 'changeStatus', payload: { peer, type, status }})
      })
    }
  }, [client, status, onlinerDispatch])

  const resolveENS = useCallback(async (peers: string[]) => {
    if (provider) {
      peers.forEach(async (peer) => {
        const ens = await provider.lookupAddress(peer)

        if (ens) {
          const address = await provider.resolveName(ens)

          if (address && peer === address.toLowerCase()) {
            dispatch({ type: CHANGE_NAME, payload: { peer, key: 'ens', name: ens } })
          }
        }
      })
    }
  }, [provider])

  const resolveBNS = useCallback(async (peers: string[]) => {
    if (getBNS) {
      peers.forEach(async (peer) => {
        const bns = await getBNS(peer)

        if (bns) {
          dispatch({ type: CHANGE_NAME, payload: { peer, key: 'bns', name: bns } })
        }
      })
    }
  }, [getBNS])

  useEffect(() => {
    resolveBNS(Object.keys(state).filter((address) => state.peerMap[address] && state.peerMap[address].type === ADDRESS_TYPE.DEFAULT && !state.peerMap[address].bns))
    resolveENS(Object.keys(state).filter((address) => state.peerMap[address] && state.peerMap[address].type === ADDRESS_TYPE.DEFAULT && !state.peerMap[address].ens))
  }, [state, resolveENS, resolveBNS])

  const startChat = useCallback((address: string) => {
    if (address) {
      dispatch({ type: ACTIVE_CHAT, payload: { peer: address } })
    }
  }, [])

  const endChat = useCallback((address: string) => {
    if (address) {
      dispatch({ type: END_CHAT, payload: { peer: address } })
    }
  }, [])

  const sendMessage = useCallback(async (to: string, message: string) => {
    if (client) {
      await client.send_message(to, new TextEncoder().encode(message))

      dispatch({ type: RECEIVE_MESSAGE, payload: { peer: to, message: { from: account, to, message } } })
    }
  }, [client, account])

  const connectByAddress = useCallback(async (address: string) => {
    if (client && address) {
      const { address: peer, type } = getAddressWithType(address)
      console.log(`connect by address: ${peer} ${type}`)
      await client.connect_with_address(peer, type)
      console.log(`connected`)
    }
  }, [client])

  const createOffer = useCallback(async () => {
    if (client) {
      const offer = await client.create_offer()

      return offer
    }
  }, [client])

  const answerOffer = useCallback(async (offer: any) => {
    if (client && offer) {
      const answer = await client.answer_offer(offer)

      return answer
    }
  }, [client])

  const acceptAnswer = useCallback(async (transportId: any, answer: any) => {
    if (client && transportId) {
      const result = await client.accept_answer(transportId, answer)

      return result
    }
  }, [client])

  const disconnect = useCallback(async () => {
    const peers = Object.keys(state.peerMap)

    if (client && peers.length) {
      try {
        console.log(`disconnect start`)
        const promises = peers.map(async (address) => await client.disconnect(address, addressType))

        await Promise.all(promises)
        console.log(`disconnect done`)
      } catch (e) {
        console.log(`disconnect error`, e)
      }
    }
  }, [client, state, addressType])

  useEffect(() => {
    const turnUrl = localStorage.getItem('turnUrl') || process.env.NEXT_PUBLIC_TURN_URL!
    const nodeUrl = localStorage.getItem('nodeUrl') || process.env.NEXT_PUBLIC_NODE_URL!

    setTurnUrl(turnUrl)
    setNodeUrl(nodeUrl)

    localStorage.setItem('turnUrl', turnUrl)
    localStorage.setItem('nodeUrl', nodeUrl)
  }, [])

  useEffect(() => {
    fetchPeers()

    const timer = setInterval(() => {
      fetchPeers()
    }, 5000)

    return () => {
      clearInterval(timer)
    }
  }, [fetchPeers])

  useEffect(() => {
    if (!wasm) {
      const initWasm = async () => {
        const w = await init()

        setWasm(w)
      }

      initWasm()
    }
  }, [wasm])

  const initClient = useCallback(async() => {
    if (account && wasm && turnUrl && nodeUrl && signature && unsignedInfo) {
      console.log(`initClient`)
      debug(process.env.NODE_ENV !== 'development') 
      setStatus('connecting')

      const client = await Client.new_client(unsignedInfo, signature, turnUrl);
      console.log(`client`, client)
      setClient(client)

      const callback = new MessageCallbackInstance(
        async (response: any, message: any) => {
          // console.group('on custom message')
          const { relay } = response
          // console.log(`relay`, relay)
          // console.log(`destination`, relay.destination)
          // console.log(message)
          // console.log(new TextDecoder().decode(message))
          const to = relay.destination
          const from = relay.path[0]
          // console.log(`from`, from)
          // console.log(`to`, to)

          dispatch({ type: RECEIVE_MESSAGE, payload: { peer: from, message: { from, to, message: new TextDecoder().decode(message) } } })
          // console.log(chats.get(from))
          // console.groupEnd()
        }, async (
          relay: any, prev: String,
      ) => {
        // console.group('on builtin message')
        // console.log(relay)
        // console.log(prev)
        // console.groupEnd()
      },
      )

      await client.listen(callback)

      const promises = nodeUrl.split(';').map(async (url: string) => 
        await client.connect_peer_via_http(nodeUrl)
      )

      try {
        await Promise.any(promises)
        // await client.connect_peer_via_http(nodeUrl)
      } catch (e) {
        console.error(e)
      }

      setStatus('connected')

      return () => {
        setStatus('disconnected')
      }
    }
  }, [account, wasm, turnUrl, nodeUrl, signature, unsignedInfo])

  useEffect(() => {
    if (account && wasm && turnUrl && nodeUrl && signature && unsignedInfo) {
      try {
        initClient()
      } catch (e) {
        console.log(`error`, e)
        setStatus('failed')
      }
    }
  }, [account, wasm, turnUrl, nodeUrl, initClient, signature, unsignedInfo])

  return (
    <RingsContext.Provider
      value={{
        client,
        fetchPeers,
        sendMessage,
        connectByAddress,
        createOffer,
        answerOffer,
        acceptAnswer,
        turnUrl,
        setTurnUrl,
        nodeUrl,
        setNodeUrl,
        status,
        setStatus,
        disconnect,
        state,
        dispatch,
        startChat,
        endChat,
      }}
    >
      {children}
    </RingsContext.Provider>
  )
}

export default RingsProvider