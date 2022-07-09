import { useEffect, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'

import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from "next/dynamic";

import { format } from 'fecha'

import { Box, Button, Flex, Input, CloseButton, Tabs, TabList, TabPanels, Tab, TabPanel, IconButton } from '@chakra-ui/react';
import { MdOutlineClose } from 'react-icons/md';

import useRings from '../hooks/useRings'
import useWebsocket from '../hooks/useWebsocket'

import formatAddress from '../utils/formatAddress';

import ConnectByAddress from '../components/ConnectByAddress'
import ConnectByManual from '../components/ConnectByManual'

import Card from '../components/Card'
import Setting from '../components/Setting'
import Loading from '../components/Loading';

const ThemeToogle = dynamic(() => import('../components/theme'), { ssr: false })
const AccountButton = dynamic(() => import('../components/AccountButton'), { ssr: false })

const Home: NextPage = () => {
  const [time, setTime] = useState('--:--:--')
  const { account } = useWeb3React()
  const { chats, peers, fetchPeers, sendMessage, connectByAddress, status } = useRings()
  const { setJoinPublicRoom, onliners } = useWebsocket()

  const [groups, setGroups] = useState<any[]>([])

  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatList, setChatList] = useState<string[]>([])

  const [message, setMessage] = useState<string>('')

  const [sending, setSending] = useState<boolean>(false)

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
        <Box>
          <Box>
            {
              account ? (
                <>
                  <Flex mb="40px" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Box fontSize="14px">{formatAddress(account)}</Box>
                    </Box>
                    <Box>
                      <Setting />
                    </Box>
                  </Flex>

                  <Box>
                    <Box>
                      <Box mb="15px">
                        <ConnectByManual />
                      </Box>
                      <Box mb="15px">
                        <ConnectByAddress />
                      </Box>
                      <Box mb="15px" cursor="pointer" onClick={fetchPeers}>
                        update peers
                      </Box>
                      <Box mb="15px" cursor="pointer" onClick={handleJoinPublicRoom}>
                        Join Public Channel
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : 
              <AccountButton />
            }
          </Box>

          <Box>

            {
              onliners.length ?
              <Box mb="40px">
                <Box fontSize={10} mb="15px" color="#757D8A">Plublic</Box>
                <Box>
                    {
                      onliners.map((peer) => 
                        <Flex mb="20px" cursor={ peer === account ? '' : 'pointer'} justifyContent="space-between" alignItems="center" key={peer} onClick={() => {
                          if (peer === account) {
                            return
                          }

                          handleConnectByAddress(peer)
                        }}>
                          <Box>{formatAddress(peer)}</Box>
                          { peer === account ? <Box>You</Box> : null }
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
                          cursor={ peer.state === 'connected' ? 'pointer' : ''}
                          justifyContent="space-between" 
                          alignItems="center" 
                          key={peer.address} 
                          onClick={() => {
                            if (peer.state !== 'connected') {
                              return
                            }

                            setActiveChat(peer.address)

                            if (!chatList.includes(peer.address)) {
                              setChatList([...chatList, `${peer.address}`])
                            }

                            if (!chats.get(peer.address)) {
                              chats.set(peer.address, [])
                            }
                        }}>
                          <Box>{formatAddress(peer.address)}</Box>
                          <Box>{peer.state}</Box>
                        </Flex>
                      ))
                    }
                </Box>
              </Box>: 
              null
            }
          </Box>
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
        hds.push(<Tab key={key}>
          <Flex justifyContent="space-between" alignItems="center" fontSize="10px">
            <Box>{formatAddress(key)}</Box>
            <Box
              ml="20px"
              onClick={() => {
                const list = chatList.filter((item) => item !== key)

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
              mb="30px"
            >
              <Flex alignItems="center" justifyContent={from === account ? 'flex-end' : 'flex-start'}>
                <Box 
                  display="inline-block" 
                  maxW="70%" 
                  p="10px 20px" 
                  color="#2e2e3a" 
                  bg={from === account ? '#15cd96' : "#d8d8d8"}
                  borderRadius={from === account ? '20px 20px 0 20px' : "20px 20px 20px 0"} 
                >
                  {message}
                </Box>
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
      <Card p="10px" height="100%" flexGrow="1" m="0 10px">
        <Flex height="100%" justifyContent="space-between" flexDirection="column">
          <Box>
            <Tabs variant='enclosed'>
              {renderHd()}
            </Tabs>
          </Box>
          <Card flexGrow="1" mb="10px" borderTop="none" p="15px">
            <Box className='messages-mod'>{renderMessages()}</Box>
          </Card>
          <Flex>
            <Input disabled={!account || !activeChat} fontSize={10} mr="15px" type="text" placeholder='Type message' value={message} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
            <Button disabled={!account || !activeChat || !message} isLoading={sending} onClick={handleSendMessage}>Send</Button>
          </Flex>
        </Flex>
      </Card>
    )
  }
  const renderRight = () => {
    return (
      <Box width="240px" height="100%">
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

      <Flex justifyContent="space-between" height="100%">
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </Flex>

      <Loading />
    </Box>
  )
}

export default Home
