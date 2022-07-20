import { useEffect, useState, useCallback, useRef } from 'react'
import { useWeb3React } from '@web3-react/core'

import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from "next/dynamic";

import { format } from 'fecha'

import { 
  Box, 
  Button, 
  Flex, 
  Input, 
  Tabs, 
  TabList, 
  Tab, 
  Center, 
  Tooltip,
} from '@chakra-ui/react';
import { MdOutlineClose } from 'react-icons/md';

import useRings from '../hooks/useRings'
import useWebsocket from '../hooks/useWebsocket'

import formatAddress from '../utils/formatAddress';

import ConnectByAddress from '../components/ConnectByAddress'
import ConnectByManual from '../components/ConnectByManual'

import Card from '../components/Card'
import Setting from '../components/Setting'
import Loading from '../components/Loading';
import useENS from '../hooks/useENS';

const ThemeToogle = dynamic(() => import('../components/theme'), { ssr: false })
const AccountButton = dynamic(() => import('../components/AccountButton'), { ssr: false })

const Home: NextPage = () => {
  const [time, setTime] = useState('--:--:--')
  const { account } = useWeb3React()
  const { chats, peers, sendMessage, connectByAddress, peerMap, readAllMessages } = useRings()
  const { changeStatus, onliners, onlinerMap } = useWebsocket()
  const accountName = useENS()

  const [groups, setGroups] = useState<any[]>([])

  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatList, setChatList] = useState<string[]>([])

  const [message, setMessage] = useState<string>('')

  const [sending, setSending] = useState<boolean>(false)
  const [connecting, setConnecting] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputing, setInputing] = useState(false)

  const messagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(format(new Date(), 'HH:mm:ss'))
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const handleComposition = useCallback(({ type, target: { value }}: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "compositionstart") {
      setInputing(true)
    } else if (type === "compositionend") {
      setInputing(false)
      setMessage(value)
    }  
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!inputing) {
      setMessage(e.target.value)
    }
  }, [inputing])
  
  const handleSendMessage = useCallback(async () => {
    if (sending || !message || !activeChat) {
      return false
    }

    try {
      setSending(true)
      await sendMessage(activeChat, message)

      setMessage('')
      setSending(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }

      messagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      setSending(false)
    }
  }, [message, activeChat, sending, sendMessage])

  const handleJoinPublicRoom = useCallback((status: 'join' | 'leave') => {
    if (account) {
      changeStatus(status)
    }
  }, [account, changeStatus])

  const handleConnectByAddress = useCallback(async (address: string) => {
    if (!address || connecting || address === account?.toLowerCase()) {
      return
    }

    try {
      setConnecting(true)
      await connectByAddress(address)
      setConnecting(false)
    } catch (e) {
      console.error(e)
      setConnecting(false)
    }
  }, [connectByAddress, connecting, account])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }, [handleSendMessage])

  const renderLeft = () => {
    return (
      <Card 
        width={{
          base: '100%',
          sm: '260px'
        }} 
        p="15px" 
        height={{
          base: "auto",
          sm: "100%",
        }}
      >
        <Flex height="100%" flexDirection="column" justifyContent="space-between">
          <Box>
            <Box>
              {
                account ? (
                  <>
                    <Flex mb="40px" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Box fontSize="14px">{accountName}</Box>
                      </Box>
                      <Flex
                        alignItems="center"
                      >
                        <Box
                          display={{
                            base: 'block',
                            sm: 'none'
                          }} 
                          mr="10px"
                        >
                          <ThemeToogle />
                        </Box>
                        <Setting />
                      </Flex>
                    </Flex>

                    <Box>
                      <Box mb="40px">
                        <Box mb="15px">
                          <ConnectByManual />
                        </Box>
                        {/* <Box mb="15px">
                          <ConnectByAddress />
                        </Box>
                        <Box mb="15px" cursor="pointer" onClick={fetchPeers}>
                          update peers
                        </Box> */}
                      </Box>
                    </Box>
                  </>
                ) : 
                <Flex justifyContent={{
                  base: 'space-between',
                  sm: 'space-around',
                }}>
                  <AccountButton />
                  <Center
                    alignItems="center"
                    display={{
                      base: 'flex',
                      sm: 'none'
                    }} 
                  >
                    <ThemeToogle />
                  </Center>
                </Flex>
              }
            </Box>

            <Box>
              { account ?
                <Box mb="40px">
                  <Flex mb="15px" color="#757D8A" justifyContent="space-between" alignItems="center">
                    <Box fontSize={10}>Public</Box>
                    {
                      account && !onliners.find((peer) => peer === account.toLowerCase()) ?
                      <Box cursor="pointer" onClick={() => handleJoinPublicRoom('join')}>
                        Join
                      </Box> :
                      account && onliners.find((peer) => peer === account.toLowerCase()) ?
                      <Box cursor="pointer" onClick={() => handleJoinPublicRoom('leave')}>
                        Leave
                      </Box> :
                      null
                    }
                  </Flex> 

                  <Box>
                    {
                      onliners.map((peer) => 
                        <Flex 
                          mb="20px" 
                          cursor={ peer !== account.toLowerCase() && onlinerMap.get(peer) && !peerMap.get(peer) ? 'pointer' : 'default'} 
                          justifyContent="space-between" 
                          alignItems="center" 
                          key={peer} 
                          onClick={() => handleConnectByAddress(peer)}
                        >
                          {
                            peer !== account.toLowerCase() && onlinerMap.get(peer) && !peerMap.get(peer) ?
                            <Tooltip label="add to contacts">
                              <Box>{onlinerMap.get(peer)?.name || peerMap.get(peer)?.name || formatAddress(peer)}</Box>
                            </Tooltip>:
                            <Box>{onlinerMap.get(peer)?.name || peerMap.get(peer)?.name || formatAddress(peer)}</Box>
                          }
                          {
                            peer === account.toLowerCase() ?
                            <Box>You</Box> :
                            connecting ?
                            <Box>Connecting...</Box> :
                            null
                          }
                        </Flex>)
                    }
                  </Box>
                </Box>
                : null
              }

              {
                peers.length ?
                <Box>
                  <Box fontSize={10} mb="15px" color="#757D8A">Contact</Box>
                  <Box>
                      {
                        peers.map((peer) => (
                          <Flex 
                            mb="20px" 
                            cursor={ peer.state === 'connected' ? 'pointer' : 'default'}
                            justifyContent="space-between" 
                            alignItems="center" 
                            key={peer.address} 
                            onClick={() => {
                              if (peer.state !== 'connected') {
                                return
                              }

                              setActiveChat(peer.address)
                              readAllMessages(peer.address)
                              setSending(false)

                              if (!chatList.includes(peer.address)) {
                                setChatList([...chatList, `${peer.address}`])
                              }

                              if (!chats.get(peer.address)) {
                                chats.set(peer.address, [])
                              }
                          }}>
                            <Box>{onlinerMap.get(peer.address)?.name || peerMap.get(peer.address)?.name || formatAddress(peer.address)}</Box>
                            <Box>{peer.state}</Box>
                            {
                              activeChat !== peer.address &&
                              peerMap.get(peer.address)?.hasNewMessage
                               ?
                              <Box w="6px" h="6px" borderRadius="50%" bg="red"></Box> : 
                              null
                            }
                          </Flex>
                        ))
                      }
                  </Box>
                </Box>: 
                null
              }
            </Box>
          </Box>

          <Box className='ft' display={{
            base: 'none',
            sm: 'block',
          }}>
            <ThemeToogle />
          </Box>

        </Flex>
      </Card>
    )
  }

  const renderCenter = () => {
    const renderHd = () => {
      let hds: Array<React.ReactNode> = []

      chatList.forEach((key, i) => {
        hds.push(<Tab key={i}>
          <Flex justifyContent="space-between" alignItems="center" fontSize="10px">
            <Box>{peerMap.get(key)?.name || formatAddress(key)}</Box>
            <Box
              ml="20px"
              onClick={() => {
                const list = chatList.filter((item) => item !== key)

                setSending(false)
                readAllMessages(key)

                setActiveChat(list.length ? list[0] : null)
                setChatList(list)
              }}
            >
              <MdOutlineClose size="12px" />
            </Box>
          </Flex>
        </Tab>)
      })

      return (
        <TabList>{hds}</TabList>
      )
    } 

    const renderMessages = () => {
      let messages: Array<React.ReactNode> = []

      if (activeChat && chats.get(activeChat)) {
        messages = chats.get(activeChat)!.map(({ message, from }, i) => {
          return (
            <Box 
              key={`${message}-${i}`}
              mb="20px"
            >
              <Flex alignItems="center">
                <Box color={ from === account ? "#15CD96" : '#757d8a'} mr="10px">{formatAddress(account!)} &gt; </Box>
                <Box>{message}</Box>
              </Flex>
            </Box>
          )
        })
      }

      return (
        <>{messages}</>
      )
    }

    return (
      <Card p="10px" height="100%" flexGrow="1" m={{
        base: '10px 0',
        sm: "0 10px", 
      }}>
        <Flex height="100%" justifyContent="space-between" flexDirection="column">
          <Box>
            <Tabs 
              variant='enclosed' 
              index={chatList.findIndex(key => key === activeChat)} 
              onChange={(index) => {
                setActiveChat(chatList[index])
              }}
            >
              {renderHd()}
            </Tabs>
          </Box>
          <Card flexGrow="1" mb="10px" borderTop="none" p="15px" overflowY="auto">
            <Box pb="50px">{renderMessages()}</Box>
            <Box w="100%" h="50px" ref={messagesRef} />
          </Card>
          <Flex>
            <Input 
              ref={inputRef}
              disabled={!account || !activeChat || peerMap.get(activeChat)?.state !== 'connected'}
              fontSize={10} 
              mr="15px" 
              type="text" 
              placeholder='Type message' 
              // value={message} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown} 
              // @ts-ignore
              onCompositionStart={handleComposition}
              // @ts-ignore
              onCompositionEnd={handleComposition}
            />
            <Button disabled={!account || !activeChat || peerMap.get(activeChat)?.state !== 'connected' || !message} isLoading={sending} onClick={handleSendMessage}>Send</Button>
          </Flex>
        </Flex>
      </Card>
    )
  }
  const renderRight = () => {
    return (
      <Box 
        width={{
          base: '100%',
          sm: "240px",
        }} 
        height={{
          base: 'auto',
          sm: "100%",
        }}
      >
        <Flex height="100%" flexDirection="column">
          <Card>
            <Flex p="15px" fontSize="26px" justifyContent="space-around" alignItems="center">
              {time}
            </Flex>
          </Card>

          {/* <Box>
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

            <Box className={styles['mod-member']}></Box>
          </Box> */}
        </Flex>
      </Box>
    )
  }

  return (
    <Box p="10px" height="100vh">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex 
        justifyContent={{
          base: "space-between"
        }} 
        flexDir={{
          base: 'column',
          sm: 'row'
        }}
        height="100%"
      >
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </Flex>

      <Loading />
    </Box>
  )
}

export default Home
