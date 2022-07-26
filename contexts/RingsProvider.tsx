import { useEffect, useState, useCallback, createContext } from 'react'
import { useWeb3React } from '@web3-react/core'
import web3 from "web3";

import init, { Client, Peer, UnsignedInfo, MessageCallbackInstance, debug } from '@ringsnetwork/rings-node'

import useBNS from '../hooks/useBNS';
export interface Chat_props {
  from: string,
  to: string,
  message: string
}

interface RingsContext {
  peers: Peer[],
  client: Client | null,
  chats: Map<string, Chat_props[]>,
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
  peerMap: Map<string, PeerMapProps>,
  readAllMessages: (address: string) => void 
}
interface PeerMapProps {
  address: string,
  state: string | undefined,
  transport_id: string,
  hasNewMessage: boolean,
  name: string,
  bns: string
}

export const RingsContext = createContext<RingsContext>({
  peers: [],
  client: null,
  chats: new Map(),
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
  peerMap: new Map(),
  readAllMessages: () => {}
})

const RingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, provider } = useWeb3React()
  const { getBNS } = useBNS()

  const [turnUrl, setTurnUrl] = useState('')
  const [nodeUrl, setNodeUrl] = useState('')

  const [status, setStatus] = useState<string>('disconnected')

  const [client, setClient] = useState<Client | null>(null)
  const [wasm, setWasm] = useState<any>(null)
  const [peers, setPeers] = useState<Peer[]>([])
  const [peerMap, setPeerMap] = useState<Map<string, PeerMapProps>>(new Map())

  const [chats, setChats] = useState<Map<string, Chat_props[]>>(new Map())

  const fetchPeers = useCallback(async () => {
    if (client) {
      const peers = await client.list_peers()

      setPeers([
        ...peers.map(({ address, ...rest }: Peer) => ({
          ...rest,
          address: address.startsWith(`0x`) ? address.toLowerCase() : `0x${address}`.toLowerCase(),
        }))
      ])
    }
  }, [client])

  const resolveENS = useCallback(async (peers: Peer[]) => {
    if (provider) {
      peers.forEach(async (peer) => {
        const name = await provider.lookupAddress(peer.address)

        if (name) {
          const address = await provider.resolveName(name)

          if (address && peer.address === address.toLowerCase()) {
            peerMap.set(peer.address, { ...peerMap.get(peer.address)!, name })
          }
        }
      })
    }
  }, [provider, peerMap])

  const resolveBNS = useCallback(async (peers: Peer[]) => {
    if (getBNS) {
      peers.forEach(async (peer) => {
        const name = await getBNS(peer.address)

        if (name) {
          peerMap.set(peer.address, { ...peerMap.get(peer.address)!, bns: name })
        }
      })
    }
  }, [getBNS, peerMap])

  useEffect(() => {
    peers.forEach((peer: Peer) => {
      if (!peerMap.get(peer.address)) {
        peerMap.set(peer.address, { ...peer, hasNewMessage: false, name: '', bns: '' })
      }
    })

    resolveBNS(peers)
    resolveENS(peers)
  }, [peers, peerMap, resolveENS, resolveBNS])

  const readAllMessages = useCallback((address: string) => {
    if (address) {
      peerMap.set(address, {
        ...peerMap.get(address)!,
        hasNewMessage: false
      })
    }
  }, [peerMap])

  const sendMessage = useCallback(async (to: string, message: string) => {
    if (client && peers.length) {
      await client.send_message(to, new TextEncoder().encode(message))

      chats.set(to, [...chats.get(to)!, { from: account!, to, message }])
    }
  }, [client, peers, chats, account])

  const connectByAddress = useCallback(async (address: string) => {
    if (client && address) {
      console.log(`connect by address: ${address}`)
      await client.connect_with_address(address)
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
    if (client && peers.length) {
      console.log(`disconnect start`)
      console.log(`peers`, peers)
      const promises = peers.map(async ({ address }) => await client.disconnect(address))

      await Promise.all(promises)
      console.log(`disconnect done`)
    }
  }, [client, peers])

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
    if (account && provider && wasm && turnUrl && nodeUrl) {
      debug(true)
      setStatus('connecting')
      
      const unsignedInfo = new UnsignedInfo(account);
      // @ts-ignore
      const signer = provider.getSigner(account);
      const signed = await signer.signMessage(unsignedInfo.auth);
      const sig = new Uint8Array(web3.utils.hexToBytes(signed));

      const client = await Client.new_client(unsignedInfo, sig, turnUrl);
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

          if (chats.get(from)) {
            chats.set(from, [...chats.get(from)!, { from, to, message: new TextDecoder().decode(message) }])
          } else {
            chats.set(from, [{ from, to, message: new TextDecoder().decode(message) }])
          }

          peerMap.set(from, {
            ...peerMap.get(from)!,
            hasNewMessage: true
          })

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
      } catch (e) {
        console.error(e)
      }

      setStatus('connected')

      return () => {
        setStatus('disconnected')
      }
    }
  }, [account, wasm, provider, chats, turnUrl, nodeUrl, peerMap])

  useEffect(() => {
    if (account && provider && wasm && turnUrl && nodeUrl) {
      try {
        initClient()
      } catch (e) {
        console.log(`error`, e)
        setStatus('failed')
      }
    }
  }, [account, wasm, provider, chats, turnUrl, nodeUrl, peerMap, initClient])

  return (
    <RingsContext.Provider
      value={{
        client,
        peers,
        chats,
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
        peerMap,
        readAllMessages
      }}
    >
      {children}
    </RingsContext.Provider>
  )
}

export default RingsProvider