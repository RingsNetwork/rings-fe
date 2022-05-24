import { useEffect, useState, useCallback } from 'react'

import { useWeb3React } from '@web3-react/core'

import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from "next/dynamic";
import web3 from "web3";

import { format } from 'fecha'

import init, { Client, Peer, UnsignedInfo, MessageCallbackInstance } from 'rings-node'

import styles from '../styles/Home.module.scss'
import formatAddress from '../utils/formatAddress';

const ThemeToogle = dynamic(() => import('../components/theme'), { ssr: false })
const AccountButton = dynamic(() => import('../components/AccountButton'), { ssr: false })

const Home: NextPage = () => {
  const [time, setTime] = useState('--:--:--')
  const { account, provider } = useWeb3React()
  const [client, setClient] = useState<Client | null>(null)
  const [wasm, setWasm] = useState<any>(null)

  const [groups, setGroups] = useState<any[]>([])
  const [peers, setPeers] = useState<Peer[]>([])

  const [chats, setChats] = useState<Map<string, string[]>>(new Map())

  const [activeChat, setActiveChat] = useState<string | null>(null)

  const [message, setMessage] = useState<string>('Hello, world!')

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(format(new Date(), 'HH:mm:ss'))
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!wasm) {
      const initWasm = async () => {
        const w = await init()

        setWasm(w)
      }
      
      initWasm()
    }
  }, [wasm])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (client && peers.length) {
      console.log(message)
      const d = await client.send_message(peers[0].address, message)
      console.log(d)
    }
  }, [client, peers, message])

  useEffect(() => {
    if (account && provider && !client && wasm) {
      const initClient = async () => {
        // const signFn = (str: string) => {
        //   // @ts-ignore
        //   const signer = provider.getSigner(account)

        //   return signer.signMessage(str)
        // }
        const unsignedInfo = new UnsignedInfo(account);
        console.log(`authInfo: ${unsignedInfo.auth}`)
        // @ts-ignore
        const signer = provider.getSigner(account);
        const signed = await signer.signMessage(unsignedInfo.auth);
        console.log(`signed: ${signed}`)
        const sig = new Uint8Array(web3.utils.hexToBytes(signed));
        console.log(`sig: ${sig.toString()}, len: ${sig.length}`)

        const client = new Client(unsignedInfo, sig, process.env.NEXT_PUBLIC_CLIENT_URL!);
        console.log(client)
        setClient(client)

        const callback = new MessageCallbackInstance(
          async (relay: any, prev: String, msg: any) => {
            console.group('on custom message')
            console.log(relay)
            console.log(prev)
            console.log(msg)
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
        
        await client.listen(callback)
        console.log(`listen`)

        const transportId = await client.connect_peer_via_http(process.env.NEXT_PUBLIC_SERVER_URL!);
        console.log(`transportId: ${transportId}`)
        const peers = await client.list_peers()
        console.log(peers)
        setPeers(peers)
      }

      try {
        initClient()
      } catch (e) {
        console.log(`error`, e)
      }
    } 
  }, [account, client, wasm, provider])

  const renderLeft = () => {
    return (
      <div className={styles.left}>
        <div className='hd'>
          <AccountButton />
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
              </>
            ) : null
          }
        </div>

        <div className='bd'>
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

                      if (!chats.get(peer.address)) {
                        chats.set(peer.address, [])
                      }
                    }}>{peer.address}</li>)
                  }
                </ul>
              </div>
            </div>: 
            null
          }
        </div>

        <div className='ft'>
          <ThemeToogle />
        </div>
      </div>
    )
  }

  const renderCenter = () => {
    const renderHd = () => {
      let hds: Array<React.ReactNode> = []

      chats.forEach((value, key) => {
        hds.push(<div key={key} className={key === activeChat ? 'active contact-item' : 'contact-item'} >
          <span>{key}</span>
          <span className='btn-close'>+</span>
        </div>)
      })

      hds.push(<div key={1} className="contact-item">test1</div>)
      hds.push(<div key={2} className="contact-item">test2</div>)
      hds.push(<div key={3} className="contact-item">test3</div>)

      return (
        <>{hds}</>
      )
    } 

    return (
      <div className={styles.center}>
        <div className='contacts-mod'>{renderHd()}</div>
        <div className='messages-mod'></div>
        <div className='send-mod'>
          <input className='input-text' type="text" placeholder='Type message' onChange={handleInputChange} />
          <div className='btn-send' onClick={handleSendMessage}>Send</div>
        </div>
      </div>
    )
  }
  const renderRight = () => {
    return (
      <div className={styles.right}>
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

        <div className={styles['mod-member']}>
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
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </div>
        
    </div>
  )
}

export default Home
