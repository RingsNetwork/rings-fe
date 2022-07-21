import { useEffect, useState, useRef, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import useBNS from './useBNS'

const useWebsocket = () => {
  const didUnmount = useRef(false)

  const { account, provider } = useWeb3React()
  const { getBNS } = useBNS()
  const [socketUrl, setSocketUrl] = useState('wss://api-did-dev.ringsnetwork.io/ws');

  const [onliners, setOnliners] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [onlinerMap, setOnlinerMap] = useState<Map<string, { address: string, name: string, bns: string }>>(new Map())

  const { sendJsonMessage, readyState, lastJsonMessage, getWebSocket } = useWebSocket(
    socketUrl,
    {
      shouldReconnect: (closeEvent) => didUnmount.current === false,
      retryOnError: true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  useEffect(() => {
    onliners.forEach((address: string) => {
      if (!onlinerMap.get(address)) {
        onlinerMap.set(address, { address, name: '', bns: '' })
      }
    })
  }, [onliners, onlinerMap])

  const resolveBNS = useCallback(async (peers: string[]) => {
    if (getBNS) {
      peers.forEach(async (peer) => {
        const name = await getBNS(peer)

        if (name) {
          onlinerMap.set(peer, { ...onlinerMap.get(peer)!, bns: name })
        }
      })
    }
  }, [getBNS, onlinerMap])

  const resolveENS = useCallback(async (onliners: string[]) => {
    if (provider) {
      onliners.forEach(async (address) => {
        const name = await provider.lookupAddress(address)

        if (name) {
          const _address = await provider.resolveName(name)

          if (_address && address === _address.toLowerCase()) {
            onlinerMap.set(address, { ...onlinerMap.get(address)!, name })
          }
        }
      })
    }
  }, [provider, onlinerMap])

  useEffect(() => {
    resolveENS(onliners)
  }, [onliners, resolveENS])

  const changeStatus = useCallback((status: 'join' | 'leave') => {
    if (readyState === ReadyState.OPEN && account) {
      sendJsonMessage({
        did: account,
        timestamp: Date.now(),
        data: status
      })
    }
  }, [
    readyState,
    account,
    sendJsonMessage
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
        setOnliners((prev) => [...prev.filter(peer => peer !== did), did.toLowerCase()])
      } else if (data === 'leave') {
        setOnliners((prev) => prev.filter(o => o !== did))
      } else if (data.list) {
        setOnliners(data.list)
      }
    }
  }, [lastJsonMessage])

  return {
    onliners,
    onlinerMap,
    changeStatus
  }
}

export default useWebsocket