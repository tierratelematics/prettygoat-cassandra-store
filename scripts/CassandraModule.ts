import {
    IModule,
    IStreamFactory,
    IEventDeserializer,
    ISnapshotRepository,
    IProjectionRegistry,
    IServiceLocator
} from "prettygoat";
import {interfaces} from "inversify";
import NullSnapshotRepository from "./NullSnapshotRepository";
import CassandraClient from "./CassandraClient";
import {ICassandraClient} from "./ICassandraClient";
import CassandraDeserializer from "./CassandraDeserializer";
import PollToPushStreamFactory from "./stream/PollToPushStreamFactory";
import CassandraStreamFactory from "./stream/CassandraStreamFactory";
import {TimePartitioner} from "./TimePartitioner";

class CassandraModule implements IModule {

    modules = (container: interfaces.Container) => {
        container.bind<IStreamFactory>("StreamFactory").to(CassandraStreamFactory).inSingletonScope().whenInjectedInto(PollToPushStreamFactory);
        container.bind<IEventDeserializer>("IEventDeserializer").to(CassandraDeserializer).inSingletonScope();
        container.bind<ICassandraClient>("ICassandraClient").to(CassandraClient).inSingletonScope();
        container.bind<IStreamFactory>("IStreamFactory").to(PollToPushStreamFactory).inSingletonScope();
        container.bind<ISnapshotRepository>("ISnapshotRepository").to(NullSnapshotRepository).inSingletonScope();
        container.bind<TimePartitioner>("TimePartitioner").to(TimePartitioner).inSingletonScope();
    };

    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any): void {
    }

}

export default CassandraModule
