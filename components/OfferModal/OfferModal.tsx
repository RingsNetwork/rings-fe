import React, { useCallback, useState } from 'react'
import { TransportAndIce } from 'rings-node';

import {CopyToClipboard} from 'react-copy-to-clipboard';
import Image from 'next/image'

import useRings from '../../hooks/useRings';

import Modal, { ModalProps } from '../Modal'
import ModalActions from '../ModalActions'
import ModalContent from '../ModalContent'
import ModalTitle from '../ModalTitle'

import clipboard from '../../assets/img/clippy.svg'

import styles from './index.module.scss'

const OfferModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const { createOffer, answerOffer, acceptAnswer: acceptOfferAnswer, fetchPeers } = useRings()

  const [offer, setOffer] = useState<TransportAndIce | null>(null)

  const [ice, setIce] = useState('')
  const [answer, setAnswer] = useState<TransportAndIce | null>(null)
  const [acceptAnswer, setAcceptAnswer] = useState('')

  const [activeTab, setActiveTab] = useState<'offer' | 'answer'>('offer')

  const handleCreateOffer = useCallback(async () => {
    const offer = await createOffer()

    console.log(`offer`, offer)
    setOffer(offer)
  }, [createOffer])

  const handleAnswerOffer = useCallback(async () => {
    if (ice) {
      const answer = await answerOffer(ice)

      setAnswer(answer)

      await fetchPeers() 
    }
  }, [ice, fetchPeers, answerOffer])

  const handleAcceptAnswer = useCallback(async () => {
    if (offer && offer.transport_id) {
      console.log(`handle accept answer`)
      console.log(`transport id`, offer.transport_id)
      console.log(`ice`, acceptAnswer)
      const res = await acceptOfferAnswer(offer.transport_id, acceptAnswer)
      console.log(`res`, res)

      if (onDismiss) {
        onDismiss()
      }

      await fetchPeers()
    }
  }, [offer, acceptAnswer, fetchPeers, onDismiss, acceptOfferAnswer])

  return (
    <Modal>
      <ModalTitle text="" />

      <ModalContent>
        <div className={styles['modal-offer']}>
          <div className='hd'>
            <div className='tab-hd' onClick={() => setActiveTab('offer')}>Offer</div>
            <div className='tab-hd' onClick={() => setActiveTab('answer')}>Answer</div>
          </div>
          <div className='bd'>
            {
              activeTab === 'offer' ?
              <div className='tab-bd'>
                <div className='mod-offer'>
                  <div className='offer-ice'>
                    {offer && offer.ice ? offer.ice : ''}
                  </div>
                  <div className='ft'>
                    <div className='btn' onClick={handleCreateOffer}>Create Offer</div>
                    {
                      offer && offer.ice ? 
                      <div className='btn'>
                        <CopyToClipboard text={offer && offer.ice ? offer.ice : ''}>
                          <div className='icon'>
                            <Image alt="icon" src={clipboard} width={20} height={24} />
                          </div> 
                        </CopyToClipboard>
                      </div>: null
                    }
                  </div>
                  {
                    offer && offer.ice ?
                    <>
                      <textarea className='offer-answer' onChange={({target: {value}}) => setAcceptAnswer(value)} value={acceptAnswer}></textarea>
                      <div className='btn' onClick={handleAcceptAnswer}>Accept Answer</div>
                    </> : null
                  }
                </div>
              </div> :
              null
            }

            {
              activeTab === 'answer' ?
              <div className='tab-bd'>
                <div className='mod-offer'>
                  <textarea className='offer-ice' onChange={({target: {value}}) => setIce(value)} value={ice}></textarea>
                  <div className='ft'>
                    <div className='btn' onClick={handleAnswerOffer}>Answer Offer</div>
                  </div>
                </div>
                {
                  answer && answer.ice ?
                  <div className='mod-offer'>
                    <div className='offer-ice'>{ answer.ice }</div>
                    <div className='ft'>
                      <div className='btn'>
                        <CopyToClipboard text={answer.ice}>
                          <div className='icon'>
                            <Image alt="icon" src={clipboard} width={20} height={24} />
                          </div> 
                        </CopyToClipboard>
                      </div>
                    </div>
                  </div> : null
                }
              </div> :
              null
            }
          </div>
        </div>
      </ModalContent>

      <ModalActions>
      </ModalActions>
    </Modal>
  )
}

export default OfferModal

