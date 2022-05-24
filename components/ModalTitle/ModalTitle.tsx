import React from 'react'
import styled from 'styled-components'

interface ModalTitleProps {
  text?: string
}

const ModalTitle: React.FC<ModalTitleProps> = ({ text }) => (
  <StyledModalTitle>{text}</StyledModalTitle>
)

const StyledModalTitle = styled.div`
  color: var(--color-text-primary);
  display: flex;
  font-size: 18px;
  font-weight: 700;
  justify-content: center;
  margin-bottom: 24px;
`

export default ModalTitle
