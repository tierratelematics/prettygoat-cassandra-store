import {IStreamFactory, Event, WhenBlock, IDateRetriever, IEventDeserializer, Dictionary} from "prettygoat";
import {injectable, inject} from "inversify";
import * as _ from "lodash";
import {ICassandraClient, IQuery} from "../ICassandraClient";
import {Observable} from "rxjs";
import {mergeSort} from "./MergeSort";
import * as moment from "moment";
import ICassandraConfig from "../config/ICassandraConfig";
import {Bucket, TimePartitioner} from "../TimePartitioner";

@injectable()
class CassandraStreamFactory implements IStreamFactory {

    constructor(@inject("ICassandraClient") private client: ICassandraClient,
                @inject("TimePartitioner") private timePartitioner: TimePartitioner,
                @inject("IEventDeserializer") private deserializer: IEventDeserializer,
                @inject("IDateRetriever") private dateRetriever: IDateRetriever,
                @inject("ICassandraConfig") private config: ICassandraConfig) {
    }

    from(lastEvent: Date, completions?: Observable<string>, definition?: WhenBlock<any>): Observable<Event> {
        let manifests = this.getManifests(definition);
        return this.getBuckets(lastEvent, manifests)
            .concatMap(buckets => {
                let distinctBuckets = _.sortBy(_.uniqWith(_.flatten(_.values(buckets)), _.isEqual), ["entity", "manifest"]);
                return Observable.from(distinctBuckets).concatMap(bucket => {
                    return mergeSort(_.map(manifests, manifest => {
                        if (!this.manifestHasEvents(manifest, bucket, buckets))
                            return Observable.empty();
                        else
                            return this.client
                                .paginate(this.buildQuery(lastEvent, bucket, manifest), completions)
                                .map(row => this.deserializer.toEvent(row));
                    }));
                });
            });
    }

    private getManifests(definition: WhenBlock<any>): string[] {
        return _(definition).keys().filter(key => key !== "$init" && key !== "$any").valueOf();
    }

    private getBuckets(date: Date, manifests: string[]): Observable<Dictionary<Bucket[]>> {
        if (date)
            return Observable.of(_.fromPairs(_.map(manifests, manifest => [manifest, this.timePartitioner.bucketsFrom(date)])));
        return this.client.execute(["select * from bucket_by_manifest", null])
            .map(rows => _.groupBy(rows, "manifest"))
            .map(manifestsWithBuckets => _.mapValues(manifestsWithBuckets, buckets => {
                return _.map(buckets, (bucket: any) => {
                    return {entity: bucket.entity_bucket, manifest: bucket.manifest_bucket};
                });
            }));
    }

    private manifestHasEvents(manifest: string, bucket: Bucket, bucketsMap: Dictionary<Bucket[]>): boolean {
        return !!_.find(bucketsMap[manifest], savedBucket => _.isEqual(bucket, savedBucket));
    }

    private buildQuery(startDate: Date, bucket: Bucket, manifest: string): IQuery {
        let query = "select payload, timestamp, manifest from event_by_manifest " +
                "where entity_bucket = :entityBucket and manifest_bucket = :manifestBucket and manifest = :manifest and sequence_nr < :endDate",
            params: any = {
                entityBucket: bucket.entity,
                manifestBucket: bucket.manifest,
                manifest: manifest,
                endDate: moment(this.dateRetriever.getDate()).subtract(this.config.readDelay || 500, "milliseconds").toDate().getTime()
            };

        if (startDate) {
            query += " and sequence_nr > :startDate";
            params.startDate = startDate.getTime();
        }

        return [query, params];
    }
}

export default CassandraStreamFactory
