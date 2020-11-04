import React, { useState } from "react";
import Popup from "reactjs-popup";
import "./error.css";

export function ErrorWindow(props) {
  const [open, setOpen] = useState(true);

  const onClose = () => {
    props.onClose();
    setOpen(false);
  };

  return (
    <Popup
      open={open}
      closeOnDocumentClick
      onClose={onClose}
      nested={props.nested}
    >
      <div class="container border bg-light">
        <div class="clearfix d-inline">
          <span class="clearfix">
            <button type="button" onClick={onClose} class="close">
              &times;
            </button>
          </span>
        </div>
        <h3>Error</h3>
        <p class="error">{props.error}</p>
      </div>
    </Popup>
  );
}
