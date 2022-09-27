/**
 * @definedEntityType
 */
export class Binding {
  /**
   * Cannot be updated
   */
  arguments?: object;
  /**
   * Cannot be updated
   */
  destination?: string;
  /**
   * Cannot be updated
   */
  destinationType?: "exchange" | "queue";
  rabbitmqClusterReference: RabbitmqClusterReference;
  /**
   * Cannot be updated
   */
  routingKey?: string;
  /**
   * Cannot be updated
   */
  source?: string;
  /**
   * Default to vhost '/'; cannot be updated
   */
  vhost?: string;
}

/**
 * @definedEntityType
 */
export class RabbitmqClusterReference {
  connectionSecret?: ConnectionSecret;
  /**
   * The name of the RabbitMQ cluster to reference. Have to set either name or connectionSecret, but not both.
   */
  name?: string;
  /**
   * The namespace of the RabbitMQ cluster to reference. Defaults to the namespace of the requested resource if omitted.
   */
  namespace?: string;
}

/**
 * @definedEntityType
 */
export class ConnectionSecret {
  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   */
  name?: string;
}
/**
 * @definedEntityType
 */
export class Exchange {
  arguments?: object;
  /**
   * Cannot be updated
   */
  autoDelete?: boolean;
  /**
   * Cannot be updated
   */
  durable?: boolean;
  /**
   * Required property; cannot be updated
   */
  name: string;
  rabbitmqClusterReference: RabbitmqClusterReference;
  /**
   * Cannot be updated
   */
  type?: string;
  /**
   * Default to vhost '/'; cannot be updated
   */
  vhost?: string;
}
/**
 * @definedEntityType
 */
export class Federation {
  ackMode?: "on-confirm" | "on-publish" | "no-ack";
  exchange?: string;
  expires?: number;
  maxHops?: number;
  messageTTL?: number;
  /**
   * Required property; cannot be updated
   */
  name: string;
  "prefetch-count"?: number;
  queue?: string;
  rabbitmqClusterReference: RabbitmqClusterReference;
  reconnectDelay?: number;
  trustUserId?: boolean;
  uriSecret: UriSecret;
  /**
   * Default to vhost '/'; cannot be updated
   */
  vhost?: string;
}

/**
 * @definedEntityType
 */
export class UriSecret {
  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   */
  name?: string;
}
/**
 * @definedEntityType
 */
export class Permission {
  permissions: Permissions;
  rabbitmqClusterReference: RabbitmqClusterReference;
  /**
   * Name of an existing user; must provide user or userReference, else create/update will fail; cannot be updated
   */
  user?: string;
  userReference?: UserReference;
  /**
   * Name of an existing vhost; required property; cannot be updated
   */
  vhost: string;
}

/**
 * @definedEntityType
 */
export class Permissions {
  configure?: string;
  read?: string;
  write?: string;
}

/**
 * @definedEntityType
 */
export class UserReference {
  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   */
  name?: string;
}
/**
 * @definedEntityType
 */
export class Policy {
  /**
   * What this policy applies to: 'queues', 'exchanges', or 'all'. Default to 'all'.
   */
  applyTo?: "queues" | "exchanges" | "all";
  /**
   * Policy definition. Required property.
   */
  definition: object;
  /**
   * Required property; cannot be updated
   */
  name: string;
  /**
   * Regular expression pattern used to match queues and exchanges, e.g. "^amq.". Required property.
   */
  pattern: string;
  /**
   * Default to '0'. In the event that more than one policy can match a given exchange or queue, the policy with the greatest priority applies.
   */
  priority?: number;
  rabbitmqClusterReference: RabbitmqClusterReference;
  /**
   * Default to vhost '/'; cannot be updated
   */
  vhost?: string;
}
/**
 * @definedEntityType
 */
export class Queue {
  /**
   * Queue arguments in the format of KEY: VALUE. e.g. x-delivery-limit: 10000. Configuring queues through arguments is not recommended because they cannot be updated once set; we recommend configuring queues through policies instead.
   */
  arguments?: object;
  /**
   * when set to true, queues that have had at least one consumer before are deleted after the last consumer unsubscribes.
   */
  autoDelete?: boolean;
  /**
   * When set to false queues does not survive server restart.
   */
  durable?: boolean;
  /**
   * Name of the queue; required property.
   */
  name: string;
  rabbitmqClusterReference: RabbitmqClusterReference;
  type?: string;
  /**
   * Default to vhost '/'
   */
  vhost?: string;
}
/**
 * @definedEntityType
 */
export class SchemaReplication {
  /**
   * endpoints should be one or multiple endpoints separated by ','. Must provide either spec.endpoints or endpoints in spec.upstreamSecret. When endpoints are provided in both spec.endpoints and spec.upstreamSecret, spec.endpoints takes precedence.
   */
  endpoints?: string;
  rabbitmqClusterReference: RabbitmqClusterReference;
  secretBackend?: SecretBackend;
  upstreamSecret?: UpstreamSecret;
}

/**
 * @definedEntityType
 */
export class SecretBackend {
  vault?: Vault;
}

/**
 * @definedEntityType
 */
export class Vault {
  /**
   * Path in Vault to access a KV (Key-Value) secret with the fields username and password to be used for replication. For example "secret/data/rabbitmq/config". Optional; if not provided, username and password will come from upstreamSecret instead. Have to set either secretBackend.vault.secretPath or upstreamSecret, but not both.
   */
  secretPath?: string;
}

/**
 * @definedEntityType
 */
export class UpstreamSecret {
  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   */
  name?: string;
}
/**
 * @definedEntityType
 */
export class Shovel {
  ackMode?: "on-confirm" | "on-publish" | "no-ack";
  addForwardHeaders?: boolean;
  deleteAfter?: string;
  destAddForwardHeaders?: boolean;
  destAddTimestampHeader?: boolean;
  destAddress?: string;
  destApplicationProperties?: string;
  destExchange?: string;
  destExchangeKey?: string;
  destProperties?: string;
  destProtocol?: string;
  destPublishProperties?: string;
  destQueue?: string;
  /**
   * Required property; cannot be updated
   */
  name: string;
  prefetchCount?: number;
  rabbitmqClusterReference: RabbitmqClusterReference;
  reconnectDelay?: number;
  srcAddress?: string;
  srcDeleteAfter?: string;
  srcExchange?: string;
  srcExchangeKey?: string;
  srcPrefetchCount?: number;
  srcProtocol?: string;
  srcQueue?: string;
  uriSecret: UriSecret;
  /**
   * Default to vhost '/'; cannot be updated
   */
  vhost?: string;
}
/**
 * @definedEntityType
 */
export class SuperStream {
  /**
   * Name of the queue; required property.
   */
  name: string;
  /**
   * Number of partitions to create within this super stream. Defaults to '3'.
   */
  partitions?: number;
  rabbitmqClusterReference: RabbitmqClusterReference;
  /**
   * Routing keys to use for each of the partitions in the SuperStream If unset, the routing keys for the partitions will be set to the index of the partitions
   */
  routingKeys?: string[];
  /**
   * Default to vhost '/'; cannot be updated
   */
  vhost?: string;
}
/**
 * @definedEntityType
 */
export class User {
  importCredentialsSecret?: ImportCredentialsSecret;
  rabbitmqClusterReference: RabbitmqClusterReference;
  /**
   * List of permissions tags to associate with the user. This determines the level of access to the RabbitMQ management UI granted to the user. Omitting this field will lead to a user than can still connect to the cluster through messaging protocols, but cannot perform any management actions. For more information, see https://www.rabbitmq.com/management.html#permissions.
   */
  tags?: ("management" | "policymaker" | "monitoring" | "administrator")[];
}

/**
 * @definedEntityType
 */
export class ImportCredentialsSecret {
  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   */
  name?: string;
}
/**
 * @definedEntityType
 */
export class Vhost {
  /**
   * Name of the vhost; see https://www.rabbitmq.com/vhosts.html.
   */
  name: string;
  rabbitmqClusterReference: RabbitmqClusterReference;
  tags?: string[];
  tracing?: boolean;
}
