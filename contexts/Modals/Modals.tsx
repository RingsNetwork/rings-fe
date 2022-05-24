import React, { createContext, useCallback, useState } from 'react'
import styled from 'styled-components'

interface ModalsContext {
  content?: React.ReactNode
  isOpen?: boolean
  onPresent: (content: React.ReactNode, key?: string) => void
  onDismiss: () => void
}

export const Context = createContext<ModalsContext>({
  onPresent: () => {},
  onDismiss: () => {}
})

const Modals: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<React.ReactNode>()
  const [modalKey, setModalKey] = useState<string>()

  const handlePresent = useCallback(
    (modalContent: React.ReactNode, key?: string) => {
      setModalKey(key)
      setContent(modalContent)
      setIsOpen(true)
    },
    [setContent, setIsOpen, setModalKey]
  )

  const handleDismiss = useCallback(
    () => {
      setContent(undefined)
      setIsOpen(false)
    },
    [setContent, setIsOpen]
  )

  return (
    <Context.Provider
      value={{
        content,
        isOpen,
        onPresent: handlePresent,
        onDismiss: handleDismiss
      }}
    >
      {children}
      {isOpen && (
        <StyledModalWrapper>
          <StyledModalBackdrop onClick={handleDismiss} />
          {React.isValidElement(content) &&
            React.cloneElement(content, {
              onDismiss: handleDismiss
            })}
        </StyledModalWrapper>
      )}
    </Context.Provider>
  )
}

const StyledModalWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`

const StyledModalBackdrop = styled.div`
  // background-color: #0E0D16aa;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  // background: rgba(14, 13, 22, 0.5);
  backdrop-filter: blur(3px);
`

const Styled = styled.div`
  background: rgba(14, 13, 22, 0.5);
  backdrop-filter: blur(40px);
`

export default Modals
