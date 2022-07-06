import { useEffect, useState, useCallback, createContext } from 'react'
import { useWeb3React } from '@web3-react/core'
import web3 from "web3";

import init, { Client, Peer, UnsignedInfo, MessageCallbackInstance, debug } from 'rings-node'
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
})

const RingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, provider } = useWeb3React()
  const [client, setClient] = useState<Client | null>(null)
  const [wasm, setWasm] = useState<any>(null)
  const [peers, setPeers] = useState<Peer[]>([])

  const [chats, setChats] = useState<Map<string, Chat_props[]>>(new Map())

  const fetchPeers = useCallback(async () => {
    if (client) {
      console.log(`fetch peers`)
      const peers = await client.list_peers()
      console.log(`peers`, peers)

      setPeers(peers.map(({ address, ...rest }: Peer) => ({
        ...rest,
        address: address.startsWith(`0x`) ? address : `0x${address}`,
      })))
    }
  }, [client])

  const sendMessage = useCallback(async (to: string, message: string) => {
    if (client && peers.length) {
      await client.send_message(to, new TextEncoder().encode(message))
      chats.set(to, [...chats.get(to)!, { from: account!, to, message }])
    }
  }, [client, peers, chats, account])

  const connectByAddress = useCallback(async (address: string) => {
    if (client && address) {
      console.log(`connect by address`)
      await client.connect_with_address(address)
      console.log(`connected`)
    }
  }, [client])

  const createOffer = useCallback(async () => {
    if (client) {
      const offer = await client.create_offer()

      console.log(`offer`, offer)
      return offer
    }
  }, [client])

  const answerOffer = useCallback(async (offer: any) => {
    if (client && offer) {
      const answer = await client.answer_offer(offer)

      console.log(`answer`, answer)
      return answer
    }
  }, [client])

  const acceptAnswer = useCallback(async (transportId: any, answer: any) => {
    if (client && transportId) {
      const result = await client.accept_answer(transportId, answer)

      console.log(`answer`, result)
      return result
    }
  }, [client])

  useEffect(() => {
    fetchPeers()
    // const timer = setInterval(() => {
    //   fetchPeers()
    // }, 5000)

    // return () => {
    //   clearInterval(timer)
    // }
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

  useEffect(() => {
    if (account && provider && !client && wasm) {
      const initClient = async () => {
        debug(true)
        // const signFn = (str: string) => {
        //   // @ts-ignore
        //   const signer = provider.getSigner(account)

        //   return signer.signMessage(str)
        // }
        const unsignedInfo = new UnsignedInfo(account);
        // console.log(`authInfo: ${unsignedInfo.auth}`)
        // @ts-ignore
        const signer = provider.getSigner(account);
        const signed = await signer.signMessage(unsignedInfo.auth);
        // console.log(`signed: ${signed}`)
        const sig = new Uint8Array(web3.utils.hexToBytes(signed));
        // console.log(`sig: ${sig.toString()}, len: ${sig.length}`)

        const client = new Client(unsignedInfo, sig, process.env.NEXT_PUBLIC_TURN_URL!);
        // console.log(client)
        setClient(client)

        const callback = new MessageCallbackInstance(
          async (response: any, message: any) => {
            console.group('on custom message')
            const { relay } = response
            console.log(`relay`, relay)
            console.log(`destination`, relay.destination)
            console.log(message)
            console.log(new TextDecoder().decode(message))
            const to = relay.destination
            const from = relay.path[0]
            console.log(`from`, from)
            console.log(`to`, to)

            if (chats.get(from)) {
              chats.set(from, [...chats.get(from)!, { from, to, message: new TextDecoder().decode(message) }])
            } else {
              chats.set(from, [{ from, to, message: new TextDecoder().decode(message) }])
            }

            console.log(chats.get(from))
            console.groupEnd()
          }, async (
            relay: any, prev: String,
        ) => {
          console.group('on builtin message')
          console.log(relay)
          console.log(prev)
          console.groupEnd()
        },
        )

        const listen = await client.listen(callback)
        console.log(`listen`, listen)

        const transportId = await client.connect_peer_via_http(process.env.NEXT_PUBLIC_NODE_URL!);
        console.log(`transportId: ${transportId}`)
      }

      try {
        initClient()
      } catch (e) {
        console.log(`error`, e)
      }
    }
  }, [account, client, wasm, provider, chats])

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
      }}
    >
      {children}
    </RingsContext.Provider>
  )
}

export default RingsProvider