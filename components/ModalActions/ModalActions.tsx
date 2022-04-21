import React from 'react'
import styled from 'styled-components'

const ModalActions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const l = React.Children.toArray(children).length
  return (
    <StyledModalActions>
      {React.Children.map(children, (child, i) => (
        <>
          <StyledModalAction>
            {child}
          </StyledModalAction>
          {i < l - 1 && <div className='spacer' />}
        </>
      ))}
    </StyledModalActions>
  )
}

const StyledModalActions = styled.div``

const StyledModalAction = styled.div`
  flex: 1;
`

export default ModalActions