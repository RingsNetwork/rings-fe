import { useEffect, useState, useRef, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import useWebSocket, { ReadyState } from 'react-use-websocket'

const useWebsocket = () => {
  const didUnmount = useRef(false)

  const { account } = useWeb3React()
  const [socketUrl, setSocketUrl] = useState('wss://api-did-dev.ringsnetwork.io/ws');

  const [onliners, setOnliners] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { sendJsonMessage, readyState, lastJsonMessage, getWebSocket } = useWebSocket(
    socketUrl,
    {
      shouldReconnect: (closeEvent) => didUnmount.current === false,
      retryOnError: true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

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
        setOnliners((prev) => [...prev.filter(peer => peer !== did), did])
      } else if (data === 'leave') {
        setOnliners((prev) => prev.filter(o => o !== did))
      } else if (data.list) {
        setOnliners(data.list)
      }
    }
  }, [lastJsonMessage])

  return {
    onliners,
    changeStatus
  }
}

export default useWebsocket