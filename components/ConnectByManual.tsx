import React, { useCallback, useState } from 'react'
import { TransportAndIce } from 'rings-node';

import { 
  Box, 
  Button, 
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Center,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Textarea,
} from '@chakra-ui/react'

import useRings from '../hooks/useRings';

import CopyButton from './CopyButton';

const ConnectByManual: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { createOffer, answerOffer, acceptAnswer: acceptOfferAnswer, fetchPeers } = useRings()

  const [offer, setOffer] = useState<TransportAndIce | null>(null)

  const [ice, setIce] = useState('')
  const [answer, setAnswer] = useState<TransportAndIce | null>(null)
  const [acceptAnswer, setAcceptAnswer] = useState('')

  const handleCreateOffer = useCallback(async () => {
    const offer = await createOffer()

    //@ts-ignore
    setOffer(offer)
  }, [createOffer])

  const handleAnswerOffer = useCallback(async () => {
    if (ice) {
      const answer = await answerOffer(ice)

      //@ts-ignore
      setAnswer(answer)

      await fetchPeers() 
    }
  }, [ice, fetchPeers, answerOffer])

  const handleAcceptAnswer = useCallback(async () => {
    if (offer && offer.transport_id) {
      await acceptOfferAnswer(offer.transport_id, acceptAnswer)

      onClose()
      fetchPeers()
    }
  }, [offer, acceptAnswer, fetchPeers, onClose, acceptOfferAnswer])

  return (
    <>
      <Box cursor="pointer" onClick={onOpen}>Manually Connect</Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered> 
        <ModalOverlay />

        <ModalContent>
          <ModalHeader>
            <Text fontSize="14px">Manually Connect</Text>
          </ModalHeader>

          <ModalBody>
            <Tabs isFitted>
              <TabList>
                <Tab fontSize="12px">Offer</Tab>
                <Tab fontSize="12px">Answer</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <Box minH="340px">
                    <Box>
                      <Textarea fontSize={10} isReadOnly size="lg" value={offer && offer.ice ? offer.ice : ''} />
                      <Box mt="15px">
                        <Center>
                          <Button onClick={handleCreateOffer}>Create Offer</Button>
                          <CopyButton ml="15px" code={offer && offer.ice ? offer.ice : ''} />
                        </Center>
                      </Box>
                    </Box>

                    <Box mt="40px">
                      <Textarea fontSize={10} onChange={({target: {value}}) => setAcceptAnswer(value)} value={acceptAnswer} />
                      <Box mt="15px">
                        <Center>
                          <Button onClick={handleAcceptAnswer}>Accept Answer</Button>
                        </Center>
                      </Box>
                    </Box>
                  </Box>
                </TabPanel>

                <TabPanel>
                  <Box minH="340px">
                    <Box>
                      <Textarea fontSize={10} onChange={({target: {value}}) => setIce(value)} value={ice} />
                      <Box mt="15px">
                        <Center>
                          <Button onClick={handleAnswerOffer}>Answer Offer</Button>
                        </Center>
                      </Box>
                    </Box>

                    {
                      answer && answer.ice ?
                      <Box mt="40px">
                        <Textarea fontSize={10} isReadOnly value={answer && answer.ice ? answer.ice : ''} />
                        <Box mt="15px">
                          <Center>
                            <CopyButton code={answer.ice} />
                          </Center>
                        </Box>
                      </Box> :
                      null
                    }
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <ModalCloseButton onClick={onClose} />
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ConnectByManual

