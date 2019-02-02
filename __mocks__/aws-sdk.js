class Lambda {}

Object.assign(Lambda.prototype, {
  listLayerVersions: jest.fn(() => ({
    promise: () =>
      Promise.resolve({
        LayerVersions: [{ Version: 1 }]
      })
  })),
  getLayerVersion: jest.fn(() => ({
    promise: () =>
      Promise.resolve({
        Content: { Location: "https://example.com/layer.zip" }
      })
  }))
});

module.exports = {
  config: {
    update: jest.fn()
  },
  Lambda
};
