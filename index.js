const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const ev = require("env-var");
const extract = require("extract-zip");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

const IdentityPoolId = "us-east-1:dac4a1c4-6179-4972-ba59-40c7f35dd9c6";

module.exports = class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.dst = path.join(this.serverless.config.servicePath, ".nsolid");

    this.hooks = {
      "before:package:createDeploymentArtifacts": this.createLayer.bind(this),
      "after:package:createDeploymentArtifacts": this.cleanup.bind(this),
      "before:invoke:local:invoke": this.preinvoke.bind(this)
    };

    AWS.config.update({
      region: this.serverless.service.provider.region,
      credentials: new AWS.CognitoIdentityCredentials({ IdentityPoolId }),
      httpOptions: {
        timeout: 100
      }
    });
  }

  async downloadNSolidLayer() {
    let lts;

    switch (process.release.lts) {
      case "Erbium":
        lts = 12
        break;
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

    await fs.mkdirp(this.dst);
    const dstFileLoc = path.join(this.dst, "layer.zip");
    const dstFile = fs.createWriteStream(dstFileLoc);

    await new Promise(resolve => {
      request(layerUrl).pipe(dstFile).on("finish", () => {
        resolve();
      });
    });

    await new Promise((resolve, reject) =>
      extract(dstFileLoc, { dir: this.dst }, err => {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
      })
    );

    return fs.unlink(dstFileLoc);
  }

  async addLicenseToLayer() {
    let license;
    try {
      license = dotenv.config().parsed.NSOLID_LICENSE_KEY;
      if (!license) throw new Error();
    } catch (e) {
      license = ev.get("NSOLID_LICENSE_KEY").required().asString();
    }

    if (!license || !license.length) {
      throw new Error(
        "NSOLID_LICENSE_KEY must be set in the environment or .env file"
      );
    }

    await fs.rename(
      path.join(this.dst, "bootstrap"),
      path.join(this.dst, "nsolid-bs")
    );
    await fs.writeFile(
      path.join(this.dst, "bootstrap"),
      `#!/bin/bash
      export NSOLID_LICENSE_KEY=${license}
      $(dirname "$(readlink -f "$0")")/nsolid-bs
      `,
      { mode: 0o755 }
    );
  }

  packageLayer() {
    Object.assign(this.serverless.service.layers, {
      nsolid: {
        path: ".nsolid",
        name: "NSolidRuntime"
      }
    });

    let applicableFunctions = this.serverless.service.getAllFunctions();

    if (this.serverless.service.provider.runtime === "nsolid") {
      this.serverless.service.provider.runtime = "provided";
    } else {
      applicableFunctions = applicableFunctions.filter(funcName => {
        const func = this.serverless.service.getFunction(funcName);
        if (func.runtime === "nsolid") {
          func.runtime = "provided";
          return true;
        }
      });
    }

    applicableFunctions.forEach(functionName => {
      const func = this.serverless.service.getFunction(functionName);
      func.layers = [{ Ref: "NsolidLambdaLayer" }, ...(func.layers || [])];
    });
  }

  async createLayer() {
    if (
      this.serverless.service.provider.runtime !== "nsolid" &&
      !this.serverless.service
        .getAllFunctions()
        .map(funcName => this.serverless.service.getFunction(funcName))
        .find(func => func.runtime === "nsolid")
    ) {
      throw new Error(
        "serverless-nsolid-plugin installed, but no functions configured to use this runtime. See the plugin's README.md for instructions."
      );
    }

    try {
      await this.downloadNSolidLayer();
      await this.addLicenseToLayer();
      this.packageLayer();
    } catch (e) {
      await this.cleanup();
      throw new Error(e);
    }
  }

  async cleanup() {
    await fs.remove(this.dst);
  }

  preinvoke() {
    // Fake this so that Serverless will let us invoke locally.
    const runtime = "nodejs";

    if (this.serverless.service.provider.runtime === "nsolid") {
      this.serverless.service.provider.runtime = runtime;
    }

    this.serverless.service
      .getAllFunctions()
      .map(functionName => this.serverless.service.getFunction(functionName))
      .forEach(func => {
        if (func.runtime === "nsolid") {
          func.runtime = runtime;
        }
      });
  }
};
