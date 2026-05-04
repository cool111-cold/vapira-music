import React, { CSSProperties, useState } from "react";
import { IconType } from "../types";
import { HeardIcon } from "./icon-heard";
import { PlayIcon } from "./icon-play";
import { AddIcon } from "./icon-add";
import { AllIcon } from "./icon-seeall";
import { IconClose } from "./icon-close";
import { LoadIcon } from "./icon-loading";
import { MenuIcon } from "./icon-menu";
import { CircleAddIcon } from "./icon-circle-add";
import { VolumeIcon } from "./icon-volume";
import { SkipBackIcon } from "./icon-skip-back";
import { PlayTwoIcon } from "./icon-play-two";
import { SkipNextIcon } from "./icon-skip-next";
import { LikeTwoIcon } from "./icon-like-two";
import { PauseIcon } from "./icon-pause";


type NameIcons = 'heard' | 'addList' | 'play' | 'all' | 'close' | 'load' | 'menu' | 'addCircle' | 'volume' | 'SkipBackIcon' | 'PlayTwoIcon' | 'SkipNextIcon' |
'LikeTwoIcon' | 'PauseIcon';

interface NameIconProps extends IconType {
  name: NameIcons;
  style?: CSSProperties;
  onClick?: ()=> void;
}

const iconComponents: Record<NameIcons, React.FC<IconType>> = {
  heard: HeardIcon,
  addList: AddIcon,
  play: PlayIcon,
  all: AllIcon,
  close: IconClose,
  load: LoadIcon,
  menu: MenuIcon,
  addCircle: CircleAddIcon,
  volume: VolumeIcon,
  SkipBackIcon: SkipBackIcon,
  PlayTwoIcon: PlayTwoIcon,
  SkipNextIcon: SkipNextIcon,
  LikeTwoIcon: LikeTwoIcon,
  PauseIcon: PauseIcon
};

export const Icon: React.FC<NameIconProps> = ({ 
  name, 
  size = 25, 
  color = 'white',
  onClick,
  isClick, 
  active, 
  style,
  hoverColor
 }) => {
  const [hover, setHover] = useState<string>(color);
  const defaultProps = { size, isClick, active };
  const IconComponent = iconComponents[name];

  return (
    <div 
      style={{...style, cursor: isClick ? 'pointer' : 'default'}}
      onClick={() => onClick ? onClick() : null}
      onMouseEnter={hoverColor ? () => setHover(hoverColor) : undefined}
      onMouseLeave={hoverColor ? () => setHover(color) : undefined}
    >
      <IconComponent {...defaultProps} color={hover}/>
    </div>
  );
};
