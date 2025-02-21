import React, { CSSProperties } from "react";

export const Style: { [key: string]: CSSProperties } = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hover: {
    transition: 'all ease .25s'
  }
};
