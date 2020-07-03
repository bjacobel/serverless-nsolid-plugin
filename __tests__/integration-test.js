const ServerlessNSolidPlugin = require("../index.js");

const config = {
  service: {
    provider: {
      region: "us-east-1"
    }
  },
  config: {
    servicePath: "/users/code/my-lambda"
  }
};

describe('integration tests', () => {
  // This test makes a real call to the network. It's the only way to test that our anonymous Lambda API call works.
  it("does not use credentials to hit Lambda APIs", () => {
    const plugin = new ServerlessNSolidPlugin(config);
    return expect(plugin.downloadNSolidLayer()).resolves.not.toThrow(
      "CredentialsError"
    );
  });
})
