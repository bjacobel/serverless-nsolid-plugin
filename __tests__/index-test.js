const fs = require("fs-extra");
const AWS = require("aws-sdk");
const request = require("request");
const unzip = require("extract-zip");
const dotenv = require("dotenv");

const ServerlessNSolidPlugin = require("../index.js");

jest.mock("fs-extra");
jest.mock("request");
jest.mock("extract-zip");
jest.mock("aws-sdk");
jest.mock("dotenv");
jest.mock("uuid-validate");

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

  describe("addLicenseToLayer method", () => {
    afterEach(() => {
      delete process.env.NSOLID_LICENSE_KEY;
    });

    it("gets the license from a dotenv file if present", async () => {
      const license = "fromdotenv";
      dotenv.config.mockImplementationOnce(() => ({
        parsed: {
          NSOLID_LICENSE_KEY: license
        }
      }));

      await plugin.addLicenseToLayer();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(license),
        expect.any(Object)
      );
    });

    it("gets the license from the environment if a dotenv file is not present", async () => {
      const license = "fromenvironment";
      dotenv.config.mockImplementationOnce(() => ({
        parsed: {}
      }));
      Object.assign(process.env, { NSOLID_LICENSE_KEY: license });

      await plugin.addLicenseToLayer();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(license),
        expect.any(Object)
      );
    });

    it("gets the license from the environment if a dotenv file is present but doesn't have the value", async () => {
      const license = "fromenvironment";
      dotenv.config.mockImplementationOnce(() => ({
        parsed: { NSOLID_LICENSE_KEY: "" }
      }));
      Object.assign(process.env, { NSOLID_LICENSE_KEY: license });

      await plugin.addLicenseToLayer();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(license),
        expect.any(Object)
      );
    });

    it("throws if it can't get the license from the dotenv file or the environment", async () => {
      dotenv.config.mockImplementationOnce(() => ({
        parsed: {}
      }));

      return expect(plugin.addLicenseToLayer()).rejects.toThrowError();
    });
  });
});
