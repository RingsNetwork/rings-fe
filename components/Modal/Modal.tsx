import React from 'react'

export interface ModalProps {
  onDismiss?: () => void
}

const Modal: React.FC<{ children: React.ReactNode }> = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div className="modal" style={{ zIndex: 1 }}>
      <div>{children}</div>
    </div>
  )
}

export default Modal
