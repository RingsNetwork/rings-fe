import React from 'react'
import styled from 'styled-components'

const ModalContent: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return <StyledModalContent>{children}</StyledModalContent>
}

const StyledModalContent = styled.div``

export default ModalContent
