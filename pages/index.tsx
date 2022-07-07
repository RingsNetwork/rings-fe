import { useEffect, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'

import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from "next/dynamic";

import { format } from 'fecha'

import { Box, Button, Flex, Input } from '@chakra-ui/react';

import useRings from '../hooks/useRings'
import useModal from '../hooks/useModal'
import useWebsocket from '../hooks/useWebsocket'

import formatAddress from '../utils/formatAddress';

import OfferModal from '../components/OfferModal'
import ConnectByAddress from '../components/ConnectByAddress'

import styles from '../styles/Home.module.scss'

import Card from '../components/Card'

const ThemeToogle = dynamic(() => import('../components/theme'), { ssr: false })
const AccountButton = dynamic(() => import('../components/AccountButton'), { ssr: false })

const Home: NextPage = () => {
  const [time, setTime] = useState('--:--:--')
  const { account } = useWeb3React()
  const { chats, peers, fetchPeers, sendMessage, connectByAddress, client } = useRings()
  const { setJoinPublicRoom, onliners } = useWebsocket()

  const [groups, setGroups] = useState<any[]>([])

  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatList, setChatList] = useState<string[]>([])

  const [message, setMessage] = useState<string>('')

  const [sending, setSending] = useState<boolean>(false)

  const [onPresentOfferModal] = useModal(
    <OfferModal />,
    'offer'
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(format(new Date(), 'HH:mm:ss'))
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const handleInputChange = useCallback(({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(value)
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (sending || !message || !activeChat) {
      return false
    }

    try {
      setSending(true)
      await sendMessage(activeChat, message)

      setMessage('')
      setSending(false)
    } catch (e) {
      setSending(false)
    }
  }, [message, activeChat, sending, sendMessage])

  const handleOfferModal = useCallback(
    () => {
      onPresentOfferModal()
    },
    [onPresentOfferModal]
  )

  const handleJoinPublicRoom = useCallback(() => {
    if (account) {
      setJoinPublicRoom(true)
    }
  }, [account, setJoinPublicRoom])

  const handleConnectByAddress = useCallback(async (address: string) => {
    if (address) {
      await connectByAddress(address)
    }
  }, [connectByAddress])

  const renderLeft = () => {
    return (
      <Card width="260px" p="15px" height="100%">
      <Flex height="100%" flexDirection="column" justifyContent="space-between">
        <Box className='hd'>
          {
            account ? (
              <>
                <div className={styles['mod-user']}>
                  <div className={styles.user}>
                    <div className="name">{formatAddress(account)}</div>
                    <div className="number">#1080</div>
                  </div>
                  <div className="bd">
                  </div>
                </div>

                <div className={styles['mod-search']}></div>

                <div className={styles['mod-manually-connect']}>
                  <div className='bd'>
                    <div className='btn' onClick={handleOfferModal}>Manually Connect</div>
                    <ConnectByAddress />
                    <div className='btn' onClick={fetchPeers}>update peers</div>
                    <div className='btn' onClick={handleJoinPublicRoom}>Join Public Channel</div>
                  </div>
                </div>
              </>
            ) : 
            <AccountButton />
          }
        </Box>

        <Box className='bd'>

          {
            onliners.length ?
            <div className={styles.section} style={{marginBottom: '40px'}}>
              <div className='hd'>Public</div>
              <div className='bd'>
                <ul className='list'>
                  {
                    onliners.map((peer) => 
                      <li key={peer} onClick={() => handleConnectByAddress(peer)}>
                        <span>{formatAddress(peer)}</span>
                      </li>)
                  }
                </ul>
              </div>
            </div>
            : null
          }

          {
            groups.length ?
            <div className={styles.section} style={{marginBottom: '40px'}}>
              <div className='hd'>Group</div>
              <div className='bd'>
                <ul className='list'>
                  <li># Stream_chat</li>
                  <li># Stream_chat</li>
                  <li># Stream_chat</li>
                </ul>
              </div>
            </div>: 
            null
          }

          {
            peers.length ?
            <div className={styles.section}>
              <div className='hd'>Contact</div>
              <div className='bd'>
                <ul className='list'>
                  {
                    peers.map((peer) => <li key={peer.address} onClick={() => {
                      setActiveChat(peer.address)

                      if (!chatList.includes(peer.address)) {
                        setChatList([...chatList, `${peer.address}`])
                      }

                      if (!chats.get(peer.address)) {
                        chats.set(peer.address, [])
                      }
                    }}>
                      <span>{formatAddress(peer.address)}</span>
                      <span>{peer.state}</span>
                    </li>)
                  }
                </ul>
              </div>
            </div>: 
            null
          }
        </Box>

        <Box className='ft'>
          <ThemeToogle />
        </Box>

      </Flex>
      </Card>
    )
  }

  const renderCenter = () => {
    const renderHd = () => {
      let hds: Array<React.ReactNode> = []

      chatList.forEach((key) => {
        hds.push(<Box key={key} className={key === activeChat ? 'active contact-item' : 'contact-item'} >
          <span>{formatAddress(key)}</span>
          <span 
            className='btn-close'
            onClick={() => {
              const list = chatList.filter((item) => item !== key)

              setActiveChat(list.length ? list[0] : null)
              setChatList(list)
            }}
          >+</span>
        </Box>)
      })

      return (
        <>{hds}</>
      )
    } 

    const renderMessages = () => {
      let messages: Array<React.ReactNode> = []

      if (activeChat && chats.get(activeChat)) {
        messages = chats.get(activeChat)!.map(({ message, from }, i) => {
          return (
            <Box 
              className={`message-item${from === account ? ' me' : ''}`} 
              key={`${message}-${i}`}
            >
              <Box className='bd'>
                <Box className="message">
                  {message}
                </Box>
              </Box>
            </Box>
          )
        })
      }

      return (
        <>{messages}</>
      )
    }

    return (
      <Card p="10px" height="100%" flexGrow="1" m="0 10px">
        <Flex  height="100%" justifyContent="space-between" flexDirection="column">
          <Box className='contacts-mod'>{renderHd()}</Box>
          <Box className='messages-mod'>{renderMessages()}</Box>
          <Flex>
            <Input disabled={!account} fontSize={10} mr="15px" type="text" placeholder='Type message' value={message} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
            <Button disabled={!account} onClick={handleSendMessage}>Send</Button>
          </Flex>
        </Flex>
      </Card>
    )
  }
  const renderRight = () => {
    return (
      <Card width="240px" height="100%">
      <Flex height="100%" flexDirection="column" justifyContent="space-between">
        <div className={styles['mod-clock']}>
          {time}
        </div>

        <div className={styles['mod-network']}>
          <div className="hd">
            <div>PING</div>
            <div className='value'>24ms</div>
          </div>
          <div className="bd">
            <div>NETWORK STATUS</div>
            <div className='label'>STATE IPv4</div>
            <div>ONLINE</div>
          </div>
        </div>

        <div className={styles['mod-member']}></div>

        {/* <div className={styles['mod-member']}>
          <div className={styles.section}>
            <div className='hd'>Moderator</div>
            <div className='bd'>
              <ul className='list'>
                <li>Mary Cooper</li>
              </ul>
            </div>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.section}>
            <div className='hd'>Member</div>
            <div className='bd'>
              <ul className='list'>
                <li>Mary Cooper</li>
                <li>Mary Cooper</li>
                <li>Mary Cooper</li>
                <li>Mary Cooper</li>
                <li>Mary Cooper</li>
                <li>Mary Cooper</li>
              </ul>
            </div>
          </div>
        </div> */}

      </Flex>
      </Card>
    )
  }

  return (
    <Box p="10px" height="100vh">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex justifyContent="space-between" height="100%">
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </Flex>
    </Box>
  )
}

export default Home
