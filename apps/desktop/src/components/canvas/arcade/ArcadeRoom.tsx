"use client";

import type { RefObject } from "react";

import type { ArcadeMode, ArcadePalette } from "./arcade-mode";
import { ArcadeCeiling } from "./ArcadeCeiling";
import { ArcadeDoor, type DoorExitState } from "./ArcadeDoor";
import { ArcadeFloor } from "./ArcadeFloor";
import { ArcadeWalls } from "./ArcadeWalls";

interface ArcadeRoomProps {
  mode: ArcadeMode;
  palette: ArcadePalette;
  /** Rótulo del dintel, ya traducido ("TRABAJEMOS JUNTOS"). */
  doorLabel: string;
  doorHovered: boolean;
  /** Apertura de la puerta en la salida (la escribe `ArcadeWorld`). */
  doorExit: RefObject<DoorExitState>;
  reduced: boolean;
  /** Click en la puerta o su rótulo: se va andando hasta ella. */
  onDoor: () => void;
  onDoorHover: (hovering: boolean) => void;
}

/**
 * La sala: luz, niebla, moqueta y, al fondo, la puerta de "TRABAJEMOS
 * JUNTOS" con la sala de neón detrás (`ArcadeDoor`). Paredes (`ArcadeWalls`) y
 * techo (`ArcadeCeiling`) van en sus propios módulos.
 */
export function ArcadeRoom({
  mode,
  palette,
  doorLabel,
  doorHovered,
  doorExit,
  reduced,
  onDoor,
  onDoorHover,
}: ArcadeRoomProps) {
  return (
    <group>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.background, palette.fog.near, palette.fog.far]} />
      <hemisphereLight args={[palette.hemi.sky, palette.hemi.ground, palette.hemi.intensity]} />
      <directionalLight color={palette.key.color} intensity={palette.key.intensity} position={[0.6, 6, 2]} />

      <ArcadeFloor mode={mode} palette={palette} />
      <ArcadeWalls palette={palette} />
      <ArcadeCeiling palette={palette} />

      <ArcadeDoor
        label={doorLabel}
        hovered={doorHovered}
        exit={doorExit}
        reduced={reduced}
        onDoor={onDoor}
        onHover={onDoorHover}
      />
    </group>
  );
}
