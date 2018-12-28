import {RecursivePartial} from './util';

/**
 * Definition for the most important fields of the "Meta" block of a kubernetes object
 */
interface KubernetesMeta {
    /**
    * Annotations is an unstructured key value map stored with a resource that may be set by external tools to store and retrieve arbitrary metadata. They are not queryable and should be preserved when modifying objects. More info: http://kubernetes.io/docs/user-guide/annotations
    */
    annotations?: {
        [key: string]: string;
    };
    /**
    * Map of string keys and values that can be used to organize and categorize (scope and select) objects. May match selectors of replication controllers and services. More info: http://kubernetes.io/docs/user-guide/labels
    */
    labels?: {
        [key: string]: string;
    };
    /**
    * Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names
    */
    name: string;
    /**
    * Namespace defines the space within each name must be unique. An empty namespace is equivalent to the \"default\" namespace, but \"default\" is the canonical representation. Not all objects are required to be scoped to a namespace - the value of this field for those objects will be empty.  Must be a DNS_LABEL. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/namespaces
    */
    namespace: string;
}

/**
 * Base Type for Kuberntes Objects: You should use either KubernetesObjectWithOptionalSpec or KubernetesObject
 */
interface KubernetesBaseObject {
    /**
    * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#resources
    */
    'apiVersion': string;
    /**
    * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#types-kinds
    */
    'kind': string;
    /**
    * Standard object metadata.
    */
    'metadata': KubernetesMeta;
}

export interface KubernetesObjectWithOptionalSpec<S> extends KubernetesBaseObject {
    spec: RecursivePartial<S>;
}

export interface KubernetesObject<S> extends KubernetesBaseObject {
    spec: S;
}