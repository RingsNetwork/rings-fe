import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { 
  Flex,
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
  Image,
} from '@chakra-ui/react'

import Logo from "../assets/unisat.png";

const URL = "https://unisat.io"

let adapter = null

if (typeof window !== "undefined") {
  adapter = (window as any).unisat
}

export const WALLET_PROVIDERS = [
  {
    name: "UniSat",
    url: URL,
    icon: Logo.src,
    adapter,
  },
];

const WalletContext = React.createContext<any>(null);

export default function UniSatWalletProvider({ children = null as any }) {
  const [providerUrl, setProviderUrl] = useState(URL);
  const [autoConnect, setAutoConnect] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [account, setAccount] = useState('')
  const [pubKey, setPubKey] = useState('')

  const provider = useMemo(
    () => WALLET_PROVIDERS.find(({ url }) => url === providerUrl),
    [providerUrl]
  );

  const wallet = useMemo(() => {
    if (provider) {
      return provider.adapter;
    }
  }, [provider])

  const select = useCallback(() => {
    setIsModalVisible(true)
  }, [])

  const close = useCallback(() => { 
    setIsModalVisible(false) 
  }, [])

  useEffect(() => {
    return () => {
      setAccount('')
      setConnected(false)
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        wallet,
        account,
        pubKey,
        connected,
        select,
        providerUrl,
        setProviderUrl,
        providerName:
          WALLET_PROVIDERS.find(({ url }) => url === providerUrl)?.name ??
          providerUrl,
      }}
    >
      {children}

      <Modal
        isOpen={isModalVisible}
        onClose={close}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="14px">Select a wallet provider</Text>
          </ModalHeader>

          <ModalBody>
            {
              WALLET_PROVIDERS.map((provider) => {
                const onClick = async function () {
                  setProviderUrl(provider.url);
                  setAutoConnect(true);
                  try {
                    const accounts = await provider.adapter.requestAccounts()
                    console.log(accounts)
                    const pubKey = await provider.adapter.getPublicKey()
                    console.log(pubKey)
                    setPubKey(pubKey)
                    setConnected(true)
                    setAccount(accounts[0])
                  } catch (error) {
                  }

                  close();
                };

                return (
                  <Flex 
                    key={provider.name}
                    w="100%"
                    p="18px 30px"
                    cursor="pointer"
                    alignItems="center"
                    flexGrow="0"
                    onClick={onClick}
                  >
                    <Box w={45} h={45} mr="20px">
                      <Image objectFit='cover' alt="Icon" src={provider.icon} />
                    </Box>
                    <Box fontSize="13px" fontWeight="700">{provider.name}</Box>
                  </Flex>
                )}
              )
            }
          </ModalBody>

          <ModalFooter>
            <ModalCloseButton onClick={close} />
          </ModalFooter>
        </ModalContent>
      </Modal>
    </WalletContext.Provider>
  );
}

export function useUnisatWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("Missing wallet context");
  }

  const wallet = context.wallet

  return {
    wallet: context.wallet,
    account: context.account,
    pubKey: context.pubKey,
    connected: context.connected,
    select: context.select,
    providerUrl: context.providerUrl,
    setProvider: context.setProviderUrl,
    providerName: context.providerName,
    connect() {
      wallet ? wallet.connect() : context.select();
    },
    disconnect() {
      wallet?.disconnect();
    },
  };
}