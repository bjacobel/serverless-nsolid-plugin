const fs = require("fs-extra");
const AWS = require("aws-sdk");
const request = require("request");
const unzip = require("extract-zip");

const ServerlessNSolidPlugin = require("../index.js");

jest.mock("fs-extra");
jest.mock("request");
jest.mock("extract-zip");
jest.mock("aws-sdk");

describe("plugin", () => {
  let plugin, config;

  beforeEach(() => {
    config = {
      service: {
        provider: {
          region: "us-east-1"
        }
      },
      config: {
        servicePath: "/users/code/my-lambda"
      }
    };
    plugin = new ServerlessNSolidPlugin(config);
  });

  describe("downloadNSolidLayer method", () => {
    it("tries to make a new directory", async () => {
      await plugin.downloadNSolidLayer();
      expect(fs.mkdirp).toHaveBeenCalledWith(plugin.dst);
    });

    it("does not use credentials to hit Lambda APIs", async () => {
      jest.resetModules();
      jest.unmock("aws-sdk");
      const AWS = require("aws-sdk");
      delete AWS.config.credentials;
      const ServerlessNSolidPlugin = require("../index.js");
      const plugin = new ServerlessNSolidPlugin(config);
      await plugin.downloadNSolidLayer();
      expect(AWS.config.credentials).toBeFalsy();
    });

    it("calls getLayerVersions and getLayerVersion on the result of that", async () => {
      await plugin.downloadNSolidLayer();
      expect(AWS.Lambda.prototype.listLayerVersions).toHaveBeenCalled();
      expect(AWS.Lambda.prototype.getLayerVersion).toHaveBeenCalledWith(
        expect.objectContaining({ VersionNumber: 1 })
      );
    });

    it("makes a request to the url Amazon gave us", async () => {
      await plugin.downloadNSolidLayer();
      expect(request).toHaveBeenCalledWith("https://example.com/layer.zip");
    });

    it("calls unzip on the file downloaded", async () => {
      await plugin.downloadNSolidLayer();
      expect(unzip).toHaveBeenCalledWith(
        `${plugin.dst}/layer.zip`,
        { dir: plugin.dst },
        expect.any(Function)
      );
    });

    it("deletes the zip archive when done", async () => {
      await plugin.downloadNSolidLayer();
      expect(fs.unlink).toHaveBeenCalledWith(`${plugin.dst}/layer.zip`);
    });
  });
});
