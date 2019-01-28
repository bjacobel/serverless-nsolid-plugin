# serverless-nsolid-plugin

Easily use NodeSource's [NSolid](https://nodesource.com/products/nsolid) for AWS Lambda [runtime monitoring service](https://nodesource.com/products/nsolid-aws-lambda) in your Serverless functions.


### Usage
0. [Set up a NodeSource account and obtain your NSolid License Key](https://accounts.nodesource.com/downloads/nsolid-lambda)
1. Export the license key to your env as the `NSOLID_LICENSE_KEY` environment variable. 
  - Optionally, use a `.env` file instead. The plugin will try to obtain the license key from this file if one is present. (This is considered a Serverless best practice, anyway.)
2. Install `serverless-nsolid-plugin` using yarn/npm
3. Add `serverless-nsolid-plugin` to your `serverless.yml`'s `plugins` array
4. For each function you'd like to run on top of the runtime, specify `nsolid` as the `runtime` value, e.g.:

    ```yaml
    service:
      name: myService
    provider:
      name: aws
    plugins:
      - serverless-nsolid-plugin
    functions:
      function1:
        runtime: nsolid
        handler: src/function1.js
      function2:
        runtime: python2.7
        handler: src/function2.py
      function3:
        runtime: nsolid
        handler: src/function3.js
    ```

    Or, if you'd like to use the NSolid runtime for all functions:

    ```yaml
    service:
      name: myService
    provider:
      name: aws
      runtime: nsolid
    plugins:
      - serverless-nsolid-plugin
    functions:
      function1:
        handler: src/function1.js
      function2:
        handler: src/function2.js
    ```

### Disclaimers
The NSolid runtime is not open-source. The author of this plugin (the Author) has no affiliation with NodeSource. The Author assumes users will comply with license restrictions, terms of use and usage limits established in the services provided by NodeSource. [The NSolid License can be found here](https://nodesource.com/products/nsolid/license). Any LICENSE attached to materials found in this repository applies only to materials developed by the Author, and is not intended to supercede any licensing offered by NodeSource.
