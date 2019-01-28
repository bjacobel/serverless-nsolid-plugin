# serverless-nsolid-plugin

Easily use [NSolid](https://nodesource.com/products/nsolid)'s AWS Lambda [runtime monitoring service](https://nodesource.com/products/nsolid-aws-lambda) in your Serverless functions.


### Usage
1. Install `serverless-nsolid-plugin` using yarn/npm
2. Add `serverless-nsolid-plugin` to your `serverless.yml`'s `- plugins` array
3. For each function you'd like to run on top of the runtime, specify `nsolid` as the `runtime` value, e.g.:

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
