import React from 'react'
import styled from 'styled-components'

interface WalletCardProps {
  icon: React.ReactNode
  onConnect: () => void
  title: string
}

const WalletCard: React.FC<WalletCardProps> = ({ icon, onConnect, title }) => (
  <StyledCard onClick={onConnect}>
    <StyledIcon>{icon}</StyledIcon>
    <StyledTitle>{title}</StyledTitle>
  </StyledCard>
)

const StyledCard = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 100px;
  padding: 0 60px;
  box-sizing: border-box;
  cursor: pointer;
`

const StyledIcon = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 30px;
  display: flex;
  align-items: center;
`

const StyledTitle = styled.div`
  font-size: 20px;
  color: #fff;
  font-weight: bold;
`

export default WalletCard
