# Kubernetes Metacontroller Framework

A framework for writing Kubernetes Operators easily with TypeScript; based on [metacontroller.app](http://metacontroller.app).

## Getting Started

1. Create a new package and create some basic files
```
npm init
# in the new package directory, run the following lines:
git init
npm add --save metacontroller-framework
node_modules/.bin/metacontroller-framework init
```

2. Create a `src/index.ts` file as follows:

2. Install metacontroller and your TypeScript operators (based on metacontroller-framework)
    1. We expect that *metacontroller* and the *metacontroller-framework* are deployed *in the same namespace* of your Kubernetes cluster. By default, it is "metacontroller"; but you can change this:
        ```
        export METACONTROLLER_NAMESPACE=metacontroller
        ```

    2. Install Metacontroller into your cluster (as stated in their docs)[https://metacontroller.app/guide/install/#install-metacontroller]. If you want to install it to a different namespace than `metacontroller`, you need to adjust the YAML files before applying them.

    3. Build your TypeScript operators by using the `Dockerfile` in your project directory. Push it to a repository. Alternatively, we included a `.gitlab-ci.yml` which builds and pushes the image to GitLab's own registry.

    4.


## Developing

```
# in this package
npm install
npm run build
npm link

# in the other page
npm link metacontroller-framework
npm install

```