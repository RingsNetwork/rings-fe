import { useEffect, useState, useRef } from 'react'
import { useWeb3React } from '@web3-react/core'
import useWebSocket, { ReadyState } from 'react-use-websocket'

const useWebsocket = () => {
  const didUnmount = useRef(false)

  const { account } = useWeb3React()
  const [socketUrl, setSocketUrl] = useState('wss://api-did-dev.ringsnetwork.io/ws');

  const [joinPublicRoom, setJoinPublicRoom] = useState(false)
  const [onliners, setOnliners] = useState<string[]>([])

  const { sendJsonMessage, readyState, lastJsonMessage, getWebSocket } = useWebSocket(
    socketUrl,
    // {
    //   shouldReconnect: (closeEvent) => true, //didUnmount.current === false,
    //   retryOnError: true,
    //   reconnectAttempts: 10,
    //   reconnectInterval: 3000,
    // }
  );

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, [])

  useEffect(() => {
    if (lastJsonMessage) {
      // console.log(lastJsonMessage)
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

  useEffect(() => {
    console.group(`WebSocket`)
    console.log(`time`, (new Date()).toLocaleTimeString())
    console.log(`joinPublickRoom`, joinPublicRoom)
    console.log(`readyState`, readyState)
    console.log(`account`, account)
    console.groupEnd()
    if (readyState === ReadyState.OPEN && joinPublicRoom && account) {
      sendJsonMessage({
        did: account,
        timestamp: Date.now(),
        data: 'join'
      })
    }
  }, [readyState, sendJsonMessage, account, joinPublicRoom])

  return {
    setJoinPublicRoom,
    onliners,
  }
}

export default useWebsocket