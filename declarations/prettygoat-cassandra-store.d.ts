import {ClientOptions} from "cassandra-driver";
import {IProjectionRegistry, IServiceLocator, IModule} from "prettygoat";

export interface ICassandraConfig {
    hosts: string[];
    keyspace: string;
    username?: string;
    password?: string;
    fetchSize?: number;
    readDelay?: number;
    driverOptions?: ClientOptions;
}

export interface IPollToPushConfig {
    interval: number
}

export class CassandraModule implements IModule {
    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any): void;
}
