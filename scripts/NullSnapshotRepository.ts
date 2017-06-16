import {ISnapshotRepository, Dictionary, Snapshot} from "prettygoat";
import {Observable} from "rx";
import {injectable} from "inversify";

@injectable()
class NullSnapshotRepository implements ISnapshotRepository {

    initialize(): Observable<void> {
        return Observable.just(null);
    }

    getSnapshots(): Observable<Dictionary<Snapshot<any>>> {
        return Observable.just({});
    }

    getSnapshot<T>(streamId: string): Observable<Snapshot<T>> {
        return Observable.just(null);
    }

    saveSnapshot<T>(streamId: string, snapshot: Snapshot<T>): Observable<void> {
        return Observable.just(null);
    }

    deleteSnapshot(streamId: string): Observable<void> {
        return Observable.just(null);
    }

}

export default NullSnapshotRepository
