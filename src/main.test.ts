import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSetSize = vi.fn();
const mockSetPixelRatio = vi.fn();
const mockSetClearColor = vi.fn();
const mockRender = vi.fn();
const mockSceneAdd = vi.fn();
const mockCameraPositionSet = vi.fn();
const mockCameraLookAt = vi.fn();
const mockCameraUpdateProjectionMatrix = vi.fn();

vi.mock("three", () => {
  return {
    WebGLRenderer: class {
      setSize = mockSetSize;
      setPixelRatio = mockSetPixelRatio;
      setClearColor = mockSetClearColor;
      render = mockRender;
    },
    Scene: class {
      add = mockSceneAdd;
    },
    PerspectiveCamera: class {
      position = { set: mockCameraPositionSet };
      lookAt = mockCameraLookAt;
      aspect = 0;
      updateProjectionMatrix = mockCameraUpdateProjectionMatrix;
    },
    AmbientLight: class {
      color: number;
      intensity: number;
      constructor(color: number, intensity: number) {
        this.color = color;
        this.intensity = intensity;
      }
    },
  };
});

describe("main", () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.resetModules();

    canvas = document.createElement("canvas");
    canvas.id = "game-canvas";
    document.body.appendChild(canvas);

    mockSetSize.mockClear();
    mockSetPixelRatio.mockClear();
    mockSetClearColor.mockClear();
    mockRender.mockClear();
    mockSceneAdd.mockClear();
    mockCameraPositionSet.mockClear();
    mockCameraLookAt.mockClear();
    mockCameraUpdateProjectionMatrix.mockClear();

    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 0);
    vi.stubGlobal("devicePixelRatio", 2);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function loadAndInit() {
    await import("./main");
    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  it("sets up renderer with correct dimensions, pixel ratio, and clear color", async () => {
    await loadAndInit();

    expect(mockSetSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
    expect(mockSetPixelRatio).toHaveBeenCalledWith(2);
    expect(mockSetClearColor).toHaveBeenCalledWith(0x000000);
  });

  it("creates a scene and adds an ambient light", async () => {
    await loadAndInit();

    expect(mockSceneAdd).toHaveBeenCalled();
  });

  it("positions the camera and looks at the origin", async () => {
    await loadAndInit();

    expect(mockCameraPositionSet).toHaveBeenCalledWith(0, 5, 10);
    expect(mockCameraLookAt).toHaveBeenCalledWith(0, 0, 0);
  });

  it("starts the animation loop via requestAnimationFrame", async () => {
    await loadAndInit();

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it("calls renderer.render in the animation loop", async () => {
    await loadAndInit();

    expect(mockRender).toHaveBeenCalled();
  });
});
