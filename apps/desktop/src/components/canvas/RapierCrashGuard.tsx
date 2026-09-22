"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  crashed: boolean;
}

/**
 * Tras un pánico de Rust en el WASM de Rapier (`unreachable`) wasm-bindgen
 * deja el objeto marcado como "prestado" para siempre: todo acceso posterior
 * revienta con `recursive use of an object…`, en cascada, y remontar el
 * `<Canvas>` NO lo arregla — el módulo WASM es único por página y sobrevive
 * a cualquier remount (ver issue #1, `canvas/SCENE.md`). La única recuperación
 * real es recargar el documento entero.
 *
 * Boundary de clase a propósito: React solo tiene `getDerivedStateFromError`
 * / `componentDidCatch` como API de captura de errores de render.
 */
export class RapierCrashGuard extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[RapierCrashGuard] WASM de Rapier corrupto, recargando página:", error);
    window.location.reload();
  }

  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}
