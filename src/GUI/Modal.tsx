import ReactDOM from "react-dom";
import { observer } from "mobx-react";
import { MouseEventHandler, ReactNode } from "react"

import "./Modal.css";

type Props = {
  isOpen: boolean,
  onClose: MouseEventHandler<HTMLButtonElement>,
  children: ReactNode
}

const Modal = observer(({ isOpen, onClose, children }: Props) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <dialog
      open
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal-dialog"
    >
      <div className="modal-header">
        <h4 id="modal-title" className="modal-title">Import Dialog</h4>
        <button onClick={onClose} className="modal-close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className="modal-content">
        {children}
      </div>
    </dialog>,
    document.body
  )
});

export default Modal
