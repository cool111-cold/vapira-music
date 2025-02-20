import React, { CSSProperties } from "react";
import { IconType } from "../types";
import { HeardIcon } from "./icon-heard";
import { PlayIcon } from "./icon-play";
import { AddIcon } from "./icon-add";
import { AllIcon } from "./icon-seeall";
import { IconClose } from "./icon-close";
import { LoadIcon } from "./icon-loading";

type NameIcons = 'heard' | 'addList' | 'play' | 'all' | 'close' | 'load';

interface NameIconProps extends IconType {
  name: NameIcons;
  style?: CSSProperties;
}

const iconComponents: Record<NameIcons, React.FC<IconType>> = {
  heard: HeardIcon,
  addList: AddIcon,
  play: PlayIcon,
  all: AllIcon,
  close: IconClose,
  load: LoadIcon,
};

export const Icon: React.FC<NameIconProps> = ({ name, size = 25, color = 'white', isClick, active, style }) => {
  const defaultProps = { size, color, isClick, active };
  const IconComponent = iconComponents[name];

  return (
    <div style={style}>
      <IconComponent {...defaultProps} />
    </div>
  );
};
