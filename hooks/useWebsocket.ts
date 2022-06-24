import { useEffect, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import useWebSocket, { ReadyState } from 'react-use-websocket'

const useWebsocket = () => {
  const { account } = useWeb3React()
  const [socketUrl, setSocketUrl] = useState('wss://api-did-dev.ringsnetwork.io/ws');

  const [joinPublicRoom, setJoinPublicRoom] = useState(false)
  const [onliners, setOnliners] = useState<string[]>([])

  const { sendJsonMessage, readyState, lastJsonMessage, getWebSocket } = useWebSocket(
    socketUrl
  );

  useEffect(() => {
    if (lastJsonMessage) {
      console.log(lastJsonMessage)
      const { did, data } = lastJsonMessage

      if (data === 'join') {
        setOnliners((prev) => [...prev, did])
      } else if (data === 'leave') {
        setOnliners((prev) => prev.filter(o => o !== did))
      } else if (data.list) {
        setOnliners(data.list)
      }
    }
  }, [lastJsonMessage])

  useEffect(() => {
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