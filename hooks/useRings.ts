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
  }
}

export default useRings