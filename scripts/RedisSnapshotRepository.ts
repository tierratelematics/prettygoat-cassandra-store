import {ISnapshotRepository, Snapshot} from "prettygoat";
import {Observable} from "rx";
import {inject, injectable} from "inversify";
import {Redis} from "ioredis";
import {map, zipObject, mapValues} from "lodash";

@injectable()
class RedisSnapshotRepository implements ISnapshotRepository {

    constructor(@inject("RedisClient") private client: Redis) {

    }

    initialize(): Observable<void> {
        return Observable.just(null);
    }

    getSnapshots(): Observable<Dictionary<Snapshot<any>>> {
        return Observable.fromPromise(this.client.keys("prettygoat-cassandra-store:snapshots:*"))
            .flatMap(keys => {
                return Promise
                    .all(map(keys, key => this.client.get("prettygoat-cassandra-store:snapshots:" + key)))
                    .then(snapshots => zipObject(keys, snapshots))
                    .then(snapshots => mapValues(snapshots, snapshot => JSON.parse(snapshot)));
            });

    }

    getSnapshot<T>(streamId: string): Observable<Snapshot<T>> {
        return this.getSnapshots().map(snapshots => snapshots[streamId]);
    }

    saveSnapshot<T>(streamId: string, snapshot: Snapshot<T>): Observable<void> {
        return Observable.fromPromise(this.client.set("prettygoat-cassandra-store:snapshots:" + streamId, JSON.stringify(snapshot)));
    }

    deleteSnapshot(streamId: string): Observable<void> {
        return Observable.fromPromise(this.client.del("prettygoat-cassandra-store:snapshots:" + streamId));
    }

}

export default RedisSnapshotRepository
