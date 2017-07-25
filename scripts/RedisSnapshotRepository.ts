import {ISnapshotRepository, Snapshot} from "prettygoat";
import {inject, injectable} from "inversify";
import {Redis} from "ioredis";

@injectable()
class RedisSnapshotRepository implements ISnapshotRepository {

    constructor(@inject("RedisClient") private client: Redis) {

    }

    getSnapshot<T>(name: string): Promise<Snapshot<T>> {
        return this.client.get("prettygoat-cassandra-store:snapshots:" + name)
            .then(snapshot => {
                let parsed = JSON.parse(snapshot);
                if (parsed)
                    parsed.lastEvent = new Date(parsed.lastEvent);
                return parsed;
            });
    }

    saveSnapshot<T>(name: string, snapshot: Snapshot<T>): Promise<void> {
        return this.client.set("prettygoat-cassandra-store:snapshots:" + name, JSON.stringify(snapshot));
    }

    deleteSnapshot(name: string): Promise<void> {
        return this.client.del("prettygoat-cassandra-store:snapshots:" + name);
    }

}

export default RedisSnapshotRepository
