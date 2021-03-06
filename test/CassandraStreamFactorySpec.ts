import "reflect-metadata";
import expect = require("expect.js");
import {Mock, IMock, Times, It} from "typemoq";
import {Observable} from "rxjs";
import {Event, IDateRetriever, IEventDeserializer, WhenBlock} from "prettygoat";
import {ICassandraClient, IQuery} from "../scripts/ICassandraClient";
import CassandraStreamFactory from "../scripts/stream/CassandraStreamFactory";
import {TimePartitioner} from "../scripts/TimePartitioner";

describe("Cassandra stream factory, given a stream factory", () => {

    let client: IMock<ICassandraClient>;
    let subject: CassandraStreamFactory;
    let timePartitioner: IMock<TimePartitioner>;
    let events: Event[];
    let dateRetriever: IMock<IDateRetriever>;
    let endDate = new Date(9600);
    let definition: WhenBlock<any> = {
        $init: () => {},
        Event1: (s, e) => {}
    };

    beforeEach(() => {
        events = [];
        dateRetriever = Mock.ofType<IDateRetriever>();
        timePartitioner = Mock.ofType<TimePartitioner>();
        let deserializer = Mock.ofType<IEventDeserializer>();
        client = Mock.ofType<ICassandraClient>();
        client.setup(c => c.execute(It.isValue<IQuery>(["select * from bucket_by_manifest", null]))).returns(a => Observable.of([
            {"manifest": "Event1", "entity_bucket": "20180000T000000Z", "manifest_bucket": "20180629T160000Z"},
            {"manifest": "Event1", "entity_bucket": "20170000T000000Z", "manifest_bucket": "20170629T150000Z"},
            {"manifest": "Event1", "entity_bucket": "20170000T000000Z", "manifest_bucket": "20170629T160000Z"},
            {"manifest": "Event2", "entity_bucket": "20160000T000000Z", "manifest_bucket": "20160629T160000Z"}
        ]));
        dateRetriever.setup(d => d.getDate()).returns(() => new Date(10000));
        deserializer.setup(d => d.toEvent(It.isAny())).returns(row => row);
        subject = new CassandraStreamFactory(client.object, timePartitioner.object, deserializer.object, dateRetriever.object, {
                hosts: [],
                keyspace: "",
                readDelay: 400
            });
    });

    context("when all the events needs to be fetched", () => {
        beforeEach(() => {
            setupClient(client, null, endDate);
        });

        it("should retrieve the events from the beginning", () => {
            subject.from(null, Observable.empty<string>(), definition).subscribe(event => events.push(event));

            expect(events).to.have.length(3);
            expect(events[0].payload).to.be(10);
            expect(events[1].payload).to.be(20);
            expect(events[2].payload).to.be(30);
        });
    });

    context("when starting the stream from any point", () => {
        beforeEach(() => {
            setupClient(client, null, endDate);
        });

        it("should read the events with a configured delay", () => {
            subject.from(null, Observable.empty<string>(), definition).subscribe(() => null);

            client.verify(c => c.paginate(It.isValue<IQuery>(["select payload, timestamp, manifest from event_by_manifest " +
            "where entity_bucket = :entityBucket and manifest_bucket = :manifestBucket and manifest = :manifest and sequence_nr < :endDate", {
                entityBucket: "20170000T000000Z",
                manifestBucket: "20170629T150000Z",
                manifest: "Event1",
                endDate: endDate.getTime()
            }]), It.isAny()), Times.once());
        });
    });

    context("when starting the stream from a certain point", () => {
        beforeEach(() => {
            timePartitioner.setup(t => t.bucketsFrom(It.isValue(new Date(800)))).returns(a => [
                {"entity": "20170000T000000Z", "manifest": "20170629T160000Z"},
                {"entity": "20180000T000000Z", "manifest": "20180629T160000Z"}
            ]);
            setupClient(client, new Date(800), endDate);
        });

        it("should retrieve the events in all the buckets greater than that point", () => {
            subject.from(new Date(800), Observable.empty<string>(), definition).subscribe(event => events.push(event));

            expect(events).to.have.length(1);
            expect(events[0].payload).to.be(30);
        });
    });

    function setupClient(cassandraClient: IMock<ICassandraClient>, startDate: Date, finalDate: Date) {
        cassandraClient.setup(c => c.paginate(It.isValue<IQuery>(buildQuery("20170000T000000Z", "20170629T150000Z", startDate, finalDate)), It.isAny()))
            .returns(a => Observable.create(observer => {
                observer.next({
                    type: "Event1",
                    payload: 10,
                    timestamp: new Date(1000)
                });
                observer.next({
                    type: "Event1",
                    payload: 20,
                    timestamp: new Date(2000)
                });
                observer.complete();
            }));
        cassandraClient.setup(c => c.paginate(It.isValue<IQuery>(buildQuery("20170000T000000Z", "20170629T160000Z", startDate, finalDate)), It.isAny()))
            .returns(a => Observable.create(observer => {
                observer.complete();
            }));
        cassandraClient.setup(c => c.paginate(It.isValue<IQuery>(buildQuery("20180000T000000Z", "20180629T160000Z", startDate, finalDate)), It.isAny()))
            .returns(a => Observable.create(observer => {
                observer.next({
                    type: "Event1",
                    payload: 30,
                    timestamp: new Date(5000)
                });
                observer.complete();
            }));
    }

    function buildQuery(entityBucket: string, manifestBucket: string, startDate: Date, finalDate: Date): IQuery {
        let query = "select payload, timestamp, manifest from event_by_manifest " +
                "where entity_bucket = :entityBucket and manifest_bucket = :manifestBucket and manifest = :manifest and sequence_nr < :endDate",
            params: any = {
                entityBucket: entityBucket,
                manifestBucket: manifestBucket,
                manifest: "Event1",
                endDate: finalDate.getTime()
            };
        if (startDate) {
            query += " and sequence_nr > :startDate";
            params.startDate = startDate.getTime();
        }

        return [query, params];
    }
});
