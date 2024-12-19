import type { GameState } from "@/lib/game-state";
import type { RenderState } from "../render-state";
import { PersistentEventHandlers } from "./persistant.event-handlers";
import { TransientEventHandlers } from "./transient.event-handlers";

export class RenderEventHandlers {
  readonly persistantEventHandlers: PersistentEventHandlers;
  readonly transientEventHandlers: TransientEventHandlers;
  private readonly attachmentState = {
    persistant: false,
    transient: false,
  };
  constructor(
    renderState: RenderState,
    renderCb: () => void,
    gameState: GameState
  ) {
    this.persistantEventHandlers = new PersistentEventHandlers(
      renderState,
      renderCb
    );
    this.transientEventHandlers = new TransientEventHandlers(
      renderState,
      renderCb,
      gameState
    );
  }

  attachPersistentListeners(canvas: HTMLCanvasElement) {
    if (this.attachmentState.persistant) {
      return console.log("Persistant event listeners already attached");
    }
    console.log("Attaching persistant event listeners");
    canvas.addEventListener(
      "mousedown",
      this.persistantEventHandlers.handleMouseDown
    );
    canvas.addEventListener(
      "touchstart",
      this.persistantEventHandlers.handleTouchStart
    );
    window.addEventListener(
      "mousemove",
      this.persistantEventHandlers.handlePanMove
    );
    window.addEventListener(
      "touchmove",
      this.persistantEventHandlers.handleTouchMove
    );
    window.addEventListener(
      "mouseup",
      this.persistantEventHandlers.handleMouseUp
    );
    window.addEventListener(
      "touchend",
      this.persistantEventHandlers.handleTouchEnd
    );
    this.attachmentState.persistant = true;
  }

  detachPersistentListeners(canvas: HTMLCanvasElement | null) {
    if (!this.attachmentState.persistant) {
      return console.log("Persistant event listeners already detached");
    }
    console.log("Detaching persistant event listeners");
    canvas?.removeEventListener(
      "mousedown",
      this.persistantEventHandlers.handleMouseDown
    );
    canvas?.removeEventListener(
      "touchstart",
      this.persistantEventHandlers.handleTouchStart
    );
    window.removeEventListener(
      "mousemove",
      this.persistantEventHandlers.handlePanMove
    );
    window.removeEventListener(
      "touchmove",
      this.persistantEventHandlers.handleTouchMove
    );
    window.removeEventListener(
      "mouseup",
      this.persistantEventHandlers.handleMouseUp
    );
    window.removeEventListener(
      "touchend",
      this.persistantEventHandlers.handleTouchEnd
    );
    this.attachmentState.persistant = false;
  }

  attachTransientListeners(canvas: HTMLCanvasElement) {
    if (this.attachmentState.transient) {
      return console.log("Transient event listeners already attached");
    }
    console.log("Attaching transient event listeners");
    canvas.addEventListener(
      "mousemove",
      this.transientEventHandlers.handleVertexHover
    );
    canvas.addEventListener(
      "mousemove",
      this.transientEventHandlers.handleEdgeHover
    );
    canvas.addEventListener(
      "mousemove",
      this.transientEventHandlers.handleHexHover
    );
    canvas.addEventListener(
      "click",
      this.transientEventHandlers.handleVertexClick
    );
    canvas.addEventListener(
      "click",
      this.transientEventHandlers.handleEdgeClick
    );
    canvas.addEventListener(
      "click",
      this.transientEventHandlers.handleHexClick
    );
    this.attachmentState.transient = true;
  }

  detachTransientListeners(canvas: HTMLCanvasElement | null) {
    if (!this.attachmentState.transient) {
      return console.log("Transient event listeners already detached");
    }
    console.log("Detaching transient event listeners");
    canvas?.removeEventListener(
      "mousemove",
      this.transientEventHandlers.handleVertexHover
    );
    canvas?.removeEventListener(
      "mousemove",
      this.transientEventHandlers.handleEdgeHover
    );
    canvas?.removeEventListener(
      "mousemove",
      this.transientEventHandlers.handleHexHover
    );
    canvas?.removeEventListener(
      "click",
      this.transientEventHandlers.handleVertexClick
    );
    canvas?.removeEventListener(
      "click",
      this.transientEventHandlers.handleEdgeClick
    );
    canvas?.removeEventListener(
      "click",
      this.transientEventHandlers.handleHexClick
    );
    this.attachmentState.transient = false;
  }
}
