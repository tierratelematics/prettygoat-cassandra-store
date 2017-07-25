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

    context("when requesting a snapshot", () => {
        context("when it's available on redis", () => {
            beforeEach(() => {
                client.setup(c => c.get("prettygoat-cassandra-store:snapshots:proj1")).returns(() => Promise.resolve(JSON.stringify({
                    memento: {
                        count: 20
                    },
                    lastEvent: new Date(5000)
                })));
            });
            it("should be loaded", async () => {
                let snapshot = await subject.getSnapshot("proj1");

                expect(snapshot).to.eql(new Snapshot({count: 20}, new Date(5000)));
                expect(snapshot.lastEvent instanceof Date).to.be(true);
            });
        });

        context("when it's not available on redis", () => {
            beforeEach(() => {
                client.setup(c => c.get("prettygoat-cassandra-store:snapshots:proj1")).returns(() => Promise.resolve(null));
            });
            it("should not be loaded", async () => {
                let snapshot = await subject.getSnapshot("proj1");

                expect(snapshot).not.to.be.ok();
            });
        });
    });

    context("when saving a snapshot", () => {
        beforeEach(() => client.setup(c => c.set(It.isAny(), It.isAny())).returns(() => Promise.resolve()));
        it("should be stored on redis", async () => {
            await subject.saveSnapshot<any>("proj1", new Snapshot({
                key1: {count: 20},
                key2: {count: 30}
            }, new Date(5000)));

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
        it("should be removed from redis", async () => {
            await subject.deleteSnapshot("proj1");

            client.verify(c => c.del("prettygoat-cassandra-store:snapshots:proj1"), Times.once());
        });
    });
});
