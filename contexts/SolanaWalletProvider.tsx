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
import dynamic from "next/dynamic";

import { WalletAdapter } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

// @ts-ignore
const Wallet = dynamic(() => import("@project-serum/sol-wallet-adapter"), { ssr: false});

import { useLocalStorageState } from "../utils";

import PhantomLogo from "../assets/phantom.png";

const PHANTOM_URL = "https://www.phantom.app"

export const WALLET_PROVIDERS = [
  {
    name: "Phantom",
    url: PHANTOM_URL,
    icon: PhantomLogo,
    adapter: PhantomWalletAdapter,
  },
];

const WalletContext = React.createContext<any>(null);

export function WalletProvider({ children = null as any }) {
  const [autoConnect, setAutoConnect] = useState(true);
  const [providerUrl, setProviderUrl] = useState(PHANTOM_URL);

  const provider = useMemo(
    () => WALLET_PROVIDERS.find(({ url }) => url === providerUrl),
    [providerUrl]
  );

  const wallet = useMemo(
    function () {
      if (provider) {
        return new (provider.adapter || Wallet)(
          providerUrl
        ) as WalletAdapter;
      }
    },
    [provider, providerUrl]
  );

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (wallet) {
      wallet.on("connect", () => {
        if (wallet.publicKey) {
          setConnected(true);
        }
      });

      wallet.on("disconnect", () => {
        setConnected(false);
      });
    }

    return () => {
      setConnected(false);

      if (wallet) {
        wallet.disconnect();
        setConnected(false);
      }
    };
  }, [wallet]);

  // useEffect(() => {
  //   if (wallet && autoConnect) {
  //     wallet.connect();
  //     setAutoConnect(false);
  //   }
  // }, [wallet, autoConnect]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const select = useCallback(() => {
    setIsModalVisible(true)
  }, []);

  const close = useCallback(() => { 
    setIsModalVisible(false) 
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
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
            const onClick = function () {
              setProviderUrl(provider.url);
              setAutoConnect(true);
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
                  <Image objectFit='cover' alt="Icon" src="data:image/png;base64,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" />
                </Box>
                <Box fontSize="13px" fontWeight="700">{provider.name}</Box>
              </Flex>
            )}
          )}
          </ModalBody>

          <ModalFooter>
            <ModalCloseButton onClick={close} />
          </ModalFooter>
        </ModalContent>
      </Modal>
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("Missing wallet context");
  }

  const wallet = context.wallet;

  return {
    connected: context.connected,
    wallet: wallet,
    providerUrl: context.providerUrl,
    setProvider: context.setProviderUrl,
    providerName: context.providerName,
    select: context.select,
    connect() {
      wallet ? wallet.connect() : context.select();
    },
    disconnect() {
      wallet?.disconnect();
    },
  };
}