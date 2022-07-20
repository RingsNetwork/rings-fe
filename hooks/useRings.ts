import { useContext } from 'react'

import { RingsContext } from '../contexts/RingsProvider';

const useRings = () => {
  const {
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
    readAllMessages,
  } = useContext(RingsContext)

  return {
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
    readAllMessages,
  }
}

export default useRings