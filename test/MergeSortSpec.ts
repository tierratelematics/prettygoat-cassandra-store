import "reflect-metadata";
import {Observable} from "rxjs";
import expect = require("expect.js");
import {Event} from "prettygoat";
import {mergeSort} from "../scripts/stream/MergeSort";

describe("Given a merge sort", () => {

    context("when a single observable is provided", () => {
        it("should push all the events in order", () => {
            let notifications: Event[] = [];
            mergeSort([Observable.create(observer => {
                observer.next(generateEvent(100));
                observer.next(generateEvent(200));
                observer.next(generateEvent(500));
                observer.complete();
            })]).subscribe(event => notifications.push(event));
            expect(notifications).to.have.length(3);
            expect(notifications[0].timestamp).to.eql(new Date(100));
            expect(notifications[1].timestamp).to.eql(new Date(200));
            expect(notifications[2].timestamp).to.eql(new Date(500));
        });
    });

    context("when multiple observable are provided", () => {
        it("should merge the events in order", () => {
            let notifications: Event[] = [];
            mergeSort([Observable.create(observer => {
                observer.next(generateEvent(100));
                observer.next(generateEvent(200));
                observer.next(generateEvent(500));
                observer.complete();
            }), Observable.create(observer => {
                observer.next(generateEvent(400));
                observer.next(generateEvent(450));
                observer.next(generateEvent(600));
                observer.complete();
            })]).subscribe(event => notifications.push(event));
            expect(notifications).to.have.length(6);
            expect(notifications[0].timestamp).to.eql(new Date(100));
            expect(notifications[1].timestamp).to.eql(new Date(200));
            expect(notifications[2].timestamp).to.eql(new Date(400));
            expect(notifications[3].timestamp).to.eql(new Date(450));
            expect(notifications[4].timestamp).to.eql(new Date(500));
            expect(notifications[5].timestamp).to.eql(new Date(600));
        });

        context("and a fetch events is pushed in the sequence", () => {
            it("should maintain the order of that event", () => {
                let notifications: Event[] = [];
                mergeSort([Observable.create(observer => {
                    observer.next(generateEvent(100));
                    observer.next(generateEvent(200));
                    observer.next({
                        type: "__prettygoat_internal_fetch_events",
                        payload: null,
                        timestamp: null
                    });
                    observer.complete();
                }), Observable.create(observer => {
                    observer.next(generateEvent(150));
                    observer.next(generateEvent(450));
                    observer.complete();
                })]).subscribe(event => notifications.push(event));
                expect(notifications).to.have.length(5);
                expect(notifications[0].timestamp).to.eql(new Date(100));
                expect(notifications[1].timestamp).to.eql(new Date(150));
                expect(notifications[2].timestamp).to.eql(new Date(200));
                expect(notifications[3].type).to.eql("__prettygoat_internal_fetch_events");
                expect(notifications[4].timestamp).to.eql(new Date(450));
            });
        });
    });

    context("when no observables are provided", () => {
        it("should fire an complete", () => {
            let completed = false;
            mergeSort([]).subscribe(null, null, () => completed = true);
            expect(completed).to.be(true);
        });
    });

    function generateEvent(timestamp: number) {
        return {
            type: null,
            timestamp: new Date(timestamp),
            payload: null
        };
    }
});
