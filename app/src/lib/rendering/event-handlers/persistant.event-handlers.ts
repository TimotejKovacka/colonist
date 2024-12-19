import { PAN_LIMITS } from "@/lib/constants";
import type { RenderState } from "../render-state";
import { Point2D } from "@/lib/coordinate-system/point";

export class PersistentEventHandlers {
  constructor(
    private readonly renderState: RenderState,
    private readonly renderCb: () => void
  ) {}

  handleMouseDown = (e: MouseEvent) => {
    this.renderState.pan.isPanning = true;
    this.renderState.pan.start = new Point2D(e.clientX, e.clientY).minus(
      this.renderState.pan.offset
    );
  };

  handleMouseUp = () => {
    this.renderState.pan.isPanning = false;
  };

  handlePanMove = (e: MouseEvent) => {
    if (!this.renderState.pan.isPanning) return;
    const newOffset = new Point2D(e.clientX, e.clientY).minus(
      this.renderState.pan.start
    );

    this.renderState.pan.offset.x = Math.max(
      PAN_LIMITS.MIN_X,
      Math.min(PAN_LIMITS.MAX_X, newOffset.x)
    );
    this.renderState.pan.offset.y = Math.max(
      PAN_LIMITS.MIN_Y,
      Math.min(PAN_LIMITS.MAX_Y, newOffset.y)
    );

    this.renderCb();
  };

  handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.renderState.pan.isPanning = true;
      this.renderState.pan.start = new Point2D(
        touch.clientX,
        touch.clientY
      ).minus(this.renderState.pan.offset);
    }
  };

  handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1 && this.renderState.pan.isPanning) {
      e.preventDefault();
      const touch = e.touches[0];

      const newOffset = new Point2D(touch.clientX, touch.clientY).minus(
        this.renderState.pan.start
      );

      this.renderState.pan.offset.x = Math.max(
        PAN_LIMITS.MIN_X,
        Math.min(PAN_LIMITS.MAX_X, newOffset.x)
      );
      this.renderState.pan.offset.y = Math.max(
        PAN_LIMITS.MIN_Y,
        Math.min(PAN_LIMITS.MAX_Y, newOffset.y)
      );

      this.renderCb();
    }
  };

  handleTouchEnd = () => {
    this.renderState.pan.isPanning = false;
  };
}
