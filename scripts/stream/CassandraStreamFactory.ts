import {IStreamFactory, Event, IWhen, IDateRetriever, IEventDeserializer, Dictionary} from "prettygoat";
import {injectable, inject} from "inversify";
import * as _ from "lodash";
import {ICassandraClient, IQuery} from "../ICassandraClient";
import {Observable} from "rx";
import IEventsFilter from "../IEventsFilter";
import {mergeSort} from "./MergeSort";
import * as moment from "moment";
import ICassandraConfig from "../config/ICassandraConfig";
import {Bucket, TimePartitioner} from "../TimePartitioner";

@injectable()
class CassandraStreamFactory implements IStreamFactory {

    private manifests: string[] = null;
    private buckets: Dictionary<Bucket[]> = null;

    constructor(@inject("ICassandraClient") private client: ICassandraClient,
                @inject("TimePartitioner") private timePartitioner: TimePartitioner,
                @inject("IEventDeserializer") private deserializer: IEventDeserializer,
                @inject("IEventsFilter") private eventsFilter: IEventsFilter,
                @inject("IDateRetriever") private dateRetriever: IDateRetriever,
                @inject("ICassandraConfig") private config: ICassandraConfig) {
    }

    from(lastEvent: Date, completions?: Observable<string>, definition?: IWhen<any>): Observable<Event> {
        return this.getManifests()
            .flatMap(manifests => this.getBuckets(lastEvent))
            .do(buckets => this.buckets = buckets)
            .map(buckets => {
                let distinctBuckets = _.sortBy(_.uniqWith(_.flatten(_.values(buckets)), _.isEqual), ["entity", "manifest"]),
                    manifestList = this.eventsFilter.filter(definition);
                return Observable.from(distinctBuckets).flatMapWithMaxConcurrent(1, bucket => {
                    return mergeSort(_.map(manifestList, manifest => {
                        if (!this.manifestHasEvents(manifest, bucket))
                            return Observable.empty();
                        else
                            return this.client
                                .paginate(this.buildQuery(lastEvent, bucket, manifest), completions)
                                .map(row => this.deserializer.toEvent(row));
                    }));
                });
            })
            .concatAll();
    }

    private getManifests(): Observable<string[]> {
        if (this.manifests)
            return Observable.just(this.manifests);
        return this.client.execute(["select manifest from bucket_by_manifest", null])
            .map(rows => _(rows).map(row => row.manifest).uniq().valueOf())
            .do(manifests => {
                this.manifests = manifests;
                this.eventsFilter.setEventsList(manifests);
            });
    }

    private getBuckets(date: Date): Observable<Dictionary<Bucket[]>> {
        if (date)
            return Observable.just(_.fromPairs(_.map(this.manifests, manifest => [manifest, this.timePartitioner.bucketsFrom(date)])));
        return this.client.execute(["select * from bucket_by_manifest", null])
            .map(rows => _.groupBy(rows, "manifest"))
            .map(manifestsWithBuckets => _.mapValues(manifestsWithBuckets, buckets => {
                return _.map(buckets, (bucket: any) => {
                    return {entity: bucket.entity_bucket, manifest: bucket.manifest_bucket};
                });
            }));
    }

    private manifestHasEvents(manifest: string, bucket: Bucket): boolean {
        return !!_.find(this.buckets[manifest], savedBucket => _.isEqual(bucket, savedBucket));
    }

    private buildQuery(startDate: Date, bucket: Bucket, manifest: string): IQuery {
        let query = "select payload, timestamp, manifest from event_by_manifest " +
                "where entity_bucket = :entityBucket and manifest_bucket = :manifestBucket and manifest = :manifest and sequence_nr < :endDate",
            params: any = {
                entityBucket: bucket.entity,
                manifestBucket: bucket.manifest,
                manifest: manifest
            };

        if (startDate) {
            query += " and sequence_nr > :startDate";
            params.startDate = startDate.getTime();
        }
        params.endDate = moment(this.dateRetriever.getDate()).subtract(this.config.readDelay || 500, "milliseconds").toDate().getTime();

        return [query, params];
    }
}

export default CassandraStreamFactory
