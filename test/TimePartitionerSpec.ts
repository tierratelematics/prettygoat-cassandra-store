import "reflect-metadata";
import expect = require("expect.js");
import {TimePartitioner} from "../scripts/TimePartitioner";
import {IMock, Mock} from "typemoq";
import {IDateRetriever} from "prettygoat";

describe("TimePartitioner, given a date", () => {

    let subject: TimePartitioner;
    let dateRetriever: IMock<IDateRetriever>;

    beforeEach(() => {
        dateRetriever = Mock.ofType<IDateRetriever>();
        subject = new TimePartitioner(dateRetriever.object);
    });

    context("when the list of the time buckets from now is needed", () => {
        context("and it's the same year", () => {
            beforeEach(() => {
                dateRetriever.setup(d => d.getDate()).returns(() => new Date("2016-06-06T08:49:22.209Z"));
            });

            it("should build it", () => {
                expect(subject.bucketsFrom(new Date("2016-06-06T05:48:22.206Z"))).to.eql([{
                    entity: "20160101T000000Z",
                    manifest: "20160606T050000Z"
                }, {
                    entity: "20160101T000000Z",
                    manifest: "20160606T060000Z"
                }, {
                    entity: "20160101T000000Z",
                    manifest: "20160606T070000Z"
                }, {
                    entity: "20160101T000000Z",
                    manifest: "20160606T080000Z"
                }]);
            });
        });

        context("and it's not the same year", () => {
            beforeEach(() => {
                dateRetriever.setup(d => d.getDate()).returns(() => new Date("2017-01-01T01:48:22.206Z"));
            });

            it("should build another entity bucket", () => {
                expect(subject.bucketsFrom(new Date("2016-12-31T23:49:22.209Z"))).to.eql([{
                    entity: "20160101T000000Z",
                    manifest: "20161231T230000Z"
                }, {
                    entity: "20170101T000000Z",
                    manifest: "20170101T000000Z"
                }, {
                    entity: "20170101T000000Z",
                    manifest: "20170101T010000Z"
                }]);
            });
        });
    });
});
