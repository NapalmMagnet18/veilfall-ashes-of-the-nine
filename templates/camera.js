// spawn6 native template "camera"
export const camera = {
  behavior: ["scripts/camera.js"],
  kind: "custom",
  orientation: { source: "look" },
  sensitivity: 3,
  state: { pitch: 0, yaw: 0 },
};
