# Kubernetes Metacontroller Framework

A framework for writing Kubernetes Operators easily with TypeScript; based on [metacontroller.app](http://metacontroller.app).

## Background

I have been unhappy with the way how we deployed applications to clusters, until now using Helm. We have encountered the problems stated in [this blog post](https://medium.com/virtuslab/think-twice-before-using-helm-25fbb18bc822); and while [helm 3](https://sweetcode.io/a-first-look-at-the-helm-3-plan/) might be promising, it is totally unclear when it will be released. The problems I see specifically with Helm for us:

- People who have Helm access effectively need full-cluster admin access. Only alternative is to run one helm/tiller per namespace; which is a lot of overhead too.
- When changing Helm charts, you need to manually redeploy every user of the chart - which is a lot of work; and makes it hard to run a cluster in a stable way over time, because you might forget that a certain Helm chart change has had consequences for already-existing deployments.
- the open source Helm charts consist of lots and lots of components with many options in values.yaml; with almost
    no validation going on.
- there is no way to integrate with external services, e.g. credentials for already-hosted databases (outside Kubernetes).

Instead, we are trying to embrace *Custom Operators (e.g. CRDs and Controllers)*, as this fully leverages the Kubernetes API model. [This blog post](https://admiralty.io/blog/kubernetes-custom-resource-controller-and-operator-development-tools/) gives a good overview. Using [Metacontroller](http://metacontroller.app/) seems to be quite boilerplate-free; so we are embracing this here. Furthermore, I really like the way you can write type-safe Kubernetes Manifests in TypeScript in [Pulumi](https://pulumi.io/); so we are trying to replicate this approach here.  The benefits we expect are:

- direct integration in the Kubernetes RBAC access control system (i.e. no root/sudo)
- when modifying an operator, one can be sure that *all* instances of the CRD get properly updated in little time.
- operators can have side-effects like creating databases in an external MySQL; and provide the credentials in the cluster
- the users do not need to learn the Helm Quirks and Tricks, but can use programming helpers instead
- TypeScript provides a way to write Kubernetes manifests with Autocompletion

## Concept

This repository contains the `metacontroller-framework` NPM package. You additionally will create a new *project NPM package*, which depends on `metacontroller-framework` and consists the configuration as well as the custom resources specific to your Kubernetes cluster. We embrace the *configuration-as-code pattern* here.

We play especially well with GitLab CI.

The `metacontroller-framework` package is responsible for the following:

- Kickstart a new project package using `metacontroller-framework init`
- manage the custom operators in code
- build the project using Gitlab CI
- (later) containing an operator library for common cases

### Overview Diagram

![Alt text](docs/Diagrams-Concepts.png?raw=true "Optional Title")

## Getting Started

This Getting Started guide is a little opinionated

This section will explain how you can get started with GitLab CI:

1. Create a new project package, add the dependency to `metacontroller-framework` and run the init script

    ```bash
    npm init
    # in the new package directory, run the following lines:
    git init
    npm add --save metacontroller-framework
    node_modules/.bin/metacontroller-framework init
    ```

2. Push the project package, e.g. to GitLab

3. configure GitLab / Kubernetes Integration:

    - FIRST, go to *Settings -> Integrations* in the project and ensure the Kubernetes integration is DISABLED (as it is deprecated)

    - SECOND, go to *Operations -> Kubernetes* in the project; and add the cluster. Follow the instructions as stated [in the GitLab documentation](https://docs.gitlab.com/ee/user/project/clusters/index.html#adding-an-existing-kubernetes-cluster).

    - Some additional hints:

        - You NEED to specify the correct project namespace; as during deployment, you will ONLY have access to this single namespace.

        - You can only specify a SINGLE namespace per project in GitLab.

        - BUG: In GitLab 11.6, is **NOT possible to change the project namespace afterwards** correctly (as the service account will not be created for the new namespace). Nasty thing: the UI will reflect the change; but the cluster connection is broken. You need to remove the cluster and re-add it in case the project namespace is wrong.

4. In your project package, create a `src/index.ts` file with the following contents:

    ```typescript
    import metacontrollerService from 'metacontroller-framework';
    import neosOperator from './operator/neos';

    const app = metacontrollerService({
        metacontrollerFrameworkDockerImage: 'hub.docker.com/namespace/package',
        operators: [
            // add the operators you want to use here.
            neosOperator
        ]
    });
    if (process.env.GENERATE_K8S) {
        app.generateKubernetesResources(__dirname + '/../generated-resources/');
    } else {
        app.listen(8080);
    }
    ```

5. Install metacontroller and your TypeScript operators (based on metacontroller-framework)

    1. We expect that *metacontroller* and the *metacontroller-framework* are deployed *in the same namespace* of your Kubernetes cluster. By default, it is "metacontroller"; but you can change this.

    2. Install Metacontroller into your cluster (as stated in their docs)[https://metacontroller.app/guide/install/#install-metacontroller]. If you want to install it to a different namespace than `metacontroller`, you need to adjust the YAML files before applying them.

    3. Use the included `Dockerfile` and `.gitlab-ci.yml`, which:

        - builds your project-specific `metacontroller-framework` Docker image
        - deploys the `metacontroller-framework` image

6. When you adjusted the operator list in `src/index.ts`, you need to register the new custom resource definitions. For this, do the following **on your local machine** (because you need to be cluster admin to do this):

    - run `npm run generate-k8s`
    - review and commit the Kubernetes resources in `generated-resources`
    - as cluster admin, apply the resources using the following command:
      ```
      kubectl -n metacontroller apply -f generated-resources/
      ```

## Developing

(TODO describe further)

```
# in this package
npm install
npm run build
npm link

# in the other page
npm link metacontroller-framework
npm install

```