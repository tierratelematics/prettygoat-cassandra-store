import "reflect-metadata";
import expect = require("expect.js");
import {IMock, Mock, Times, It} from "typemoq";
import RedisSnapshotRepository from "../scripts/RedisSnapshotRepository";
import {Redis} from "ioredis";
import {Snapshot} from "prettygoat";

describe("Given a redis snapshot repository", () => {

    let subject: RedisSnapshotRepository;
    let client: IMock<Redis>;

    beforeEach(() => {
        client = Mock.ofType<Redis>();
        subject = new RedisSnapshotRepository(client.object);
    });

    context("when requesting the snapshots", () => {
        beforeEach(() => {
            client.setup(c => c.keys("prettygoat-cassandra-store:snapshots:*")).returns(() => Promise.resolve(["proj1", "proj2"]));
            client.setup(c => c.get("prettygoat-cassandra-store:snapshots:proj1")).returns(() => Promise.resolve(JSON.stringify({
                memento: {
                    count: 20
                },
                lastEvent: 5000
            })));
            client.setup(c => c.get("prettygoat-cassandra-store:snapshots:proj2")).returns(() => Promise.resolve(JSON.stringify({
                memento: {
                    count: 30
                },
                lastEvent: 6000
            })));
        });
        it("they should be loaded", (done) => {
            subject.getSnapshots().subscribe(snapshots => {
                expect(snapshots).to.eql({
                    proj1: new Snapshot({count: 20}, new Date(5000)),
                    proj2: new Snapshot({count: 30}, new Date(6000))
                });
                done();
            });
        });
    });

    context("when saving a snapshot", () => {
        beforeEach(() => client.setup(c => c.set(It.isAny(), It.isAny())).returns(() => Promise.resolve()));
        it("should be stored on redis", () => {
            subject.saveSnapshot<any>("proj1", new Snapshot({
                key1: {count: 20},
                key2: {count: 30}
            }, new Date(5000))).subscribe();

            client.verify(c => c.set("prettygoat-cassandra-store:snapshots:proj1", JSON.stringify({
                memento: {
                    key1: {count: 20},
                    key2: {count: 30}
                },
                lastEvent: new Date(5000)
            })), Times.once());
        });
    });

    context("when deleting a snapshot", () => {
        beforeEach(() => client.setup(c => c.del(It.isAny())).returns(() => Promise.resolve()));
        it("should be removed from redis", () => {
            subject.deleteSnapshot("proj1").subscribe();

            client.verify(c => c.del("prettygoat-cassandra-store:snapshots:proj1"), Times.once());
        });
    });
});
