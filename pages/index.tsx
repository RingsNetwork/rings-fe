import { useEffect, useState } from 'react'

import { useWeb3React } from '@web3-react/core'

import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from "next/dynamic";

import { format } from 'fecha'

import init, { Client, connect_peer_via_http, UnsignedInfo } from 'bns-node'

import styles from '../styles/Home.module.scss'

const ThemeToogle = dynamic(() => import('../components/theme'), { ssr: false })
const AccountButton = dynamic(() => import('../components/AccountButton'), { ssr: false })

const Home: NextPage = () => {
  const [time, setTime] = useState('--:--:--')
  const { account, provider } = useWeb3React()
  const [client, setClient] = useState<Client | null>(null)
  const [wasm, setWasm] = useState<any>(null)

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
      const w = init()

      setWasm(w)
    }
  }, [wasm])

  useEffect(() => {
    if (account && provider && !client && wasm) {
      const initClient = async () => {
        // const signFn = (str: string) => {
        //   // @ts-ignore
        //   const signer = provider.getSigner(account)

        //   return signer.signMessage(str)
        // }
        const unsignedInfo = new UnsignedInfo(account);
        const random_key = unsignedInfo.random_key;
        console.log(`random_key: ${unsignedInfo.random_key}`)
        // @ts-ignore
        const signer = provider.getSigner(account);
        const signed = await signer.signMessage(random_key);
        console.log(`signed: ${signed}`)
        const client = new Client(unsignedInfo, signed, "stun://stun.l.google.com:19302");
        console.log(client)
        setClient(client)
        // client.start()
        const transportId = await connect_peer_via_http(client, 'http://127.0.0.1:50000/');
        console.log(`transportId: ${transportId}`)
      }

      try {
        initClient()
      } catch (e) {
        console.error(e)
      }
    } 
  }, [account, client, wasm, provider])

  const renderLeft = () => {
    return (
      <div className={styles.left}>
        <div className='hd'>
          <AccountButton />
          <div className={styles['mod-user']}>
            <div className={styles.user}>
              <div className="name">Name</div>
              <div className="number">#1080</div>
            </div>
            <div className="bd">
            </div>
          </div>

          <div className={styles['mod-search']}></div>
        </div>

        <div className='bd'>
          <div className={styles.section} style={{marginBottom: '40px'}}>
            <div className='hd'>Group</div>
            <div className='bd'>
              <ul className='list'>
                <li># Stream_chat</li>
                <li># Stream_chat</li>
                <li># Stream_chat</li>
              </ul>
            </div>
          </div>

          <div className={styles.section}>
            <div className='hd'>Contact</div>
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

        <div className='ft'>
          <ThemeToogle />
        </div>
      </div>
    )
  }

  const renderCenter = () => {
    return (
      <div className={styles.center}>center</div>
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
            <div className='hd'>Moderator</div>
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
