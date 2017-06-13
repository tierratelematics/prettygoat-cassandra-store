import "reflect-metadata";
import expect = require("expect.js");
import CassandraDeserializer from "../scripts/CassandraDeserializer";

describe("Given a cassandra deserializer", () => {
    let subject: CassandraDeserializer;

    beforeEach(() => {
        subject = new CassandraDeserializer();
    });

    context("when an event is read", () => {
        it("should be parsed correctly", () => {
            expect(subject.toEvent({
                manifest: "eventType",
                payload: '{"count": 10}',
                timestamp: new Date(901828)
            })).to.eql({
                type: "eventType",
                payload: {
                    count: 10
                },
                timestamp: new Date(901828),
                splitKey: null
            });
        });
    });
});
