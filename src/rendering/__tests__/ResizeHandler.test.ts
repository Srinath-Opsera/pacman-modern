import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { ResizeHandler } from "../ResizeHandler";

describe("ResizeHandler", () => {
  let renderer: THREE.WebGLRenderer;
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    renderer = {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
    } as unknown as THREE.WebGLRenderer;

    camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    vi.spyOn(camera, "updateProjectionMatrix");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls renderer.setSize on creation", () => {
    new ResizeHandler(renderer, camera);
    expect(renderer.setSize).toHaveBeenCalled();
  });

  it("updates camera aspect ratio on creation", () => {
    new ResizeHandler(renderer, camera);
    expect(camera.updateProjectionMatrix).toHaveBeenCalled();
  });

  it("sets pixel ratio capped at 2", () => {
    Object.defineProperty(window, "devicePixelRatio", { value: 3, writable: true });
    new ResizeHandler(renderer, camera);
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(2);
  });

  it("updates on window resize event", () => {
    new ResizeHandler(renderer, camera);
    vi.mocked(renderer.setSize).mockClear();

    window.dispatchEvent(new Event("resize"));
    expect(renderer.setSize).toHaveBeenCalled();
  });
});
