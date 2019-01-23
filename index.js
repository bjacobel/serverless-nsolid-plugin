const path = require("path");
const os = require("os");
const request = require("request");
const unzip = require("unzip-stream");
const AWS = require("aws-sdk");
const fs = require("fs-extra");

module.exports = class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      "before:package:compileLayers": this.createLayer.bind(this)
    };

    AWS.config.update({
      region: this.serverless.service.provider.region
    });
  }

  async downloadNSolidLayer(dst) {
    let lts;

    switch (process.release.lts) {
      case "Dubnium":
        lts = 10;
        break;
      case "Carbon":
        lts = 8;
        break;
      default:
        throw new Error(
          `Node ${process.version} is not supported by N|Solid Serverless.`
        );
    }

    const LayerName = `arn:aws:lambda:${AWS.config.region}:800406105498:layer:nsolid-node-${lts}`;

    const lambdaClient = new AWS.Lambda();
    const VersionNumber = (await lambdaClient
      .listLayerVersions({
        LayerName,
        MaxItems: 1
      })
      .promise()).LayerVersions[0].Version;

    const layerUrl = (await lambdaClient
      .getLayerVersion({
        LayerName,
        VersionNumber
      })
      .promise()).Content.Location;

    await new Promise(resolve => {
      request(layerUrl).pipe(unzip.Extract({ path: dst })).on("close", () => {
        resolve();
      });
    });

    return dst;
  }

  async addLicenseToLayer(dst) {
    return;
  }

  packageLayer(dst) {
    Object.assign(this.serverless.service.getAllLayers(), { nsolid: {
      path: dst,
      name: "N|Solid Runtime"
    }});

    this.serverless.service.getAllFunctions().forEach(functionName => {
      const func = this.serverless.service.getFunction(functionName);
      func.layers = ['{ "Ref": "NsolidLambdaLayer" }', ...(func.layers || [])];
    })
  }

  async cleanup(dst) {
    return fs.remove(dst);
  }

  async createLayer() {
    const dst = path.join(os.tmpdir(), "nsolid");

    try {
      await this.downloadNSolidLayer(dst);
      await this.addLicenseToLayer(dst);
      this.packageLayer(dst);
    } catch (e) {
      throw new Error(e);
    } finally {
      this.cleanup(dst);
    }
  }
};
