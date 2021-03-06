import {Event} from "prettygoat";
import {Observable, Observer, Subscription} from "rxjs";
import * as _ from "lodash";

export function mergeSort(observables: Observable<Event>[]): Observable<Event> {
    return Observable.create(observer => {
        if (!observables.length) return observer.complete();

        let buffers: Event[][] = _.map(observables, o => []);
        let completed: boolean[] = _.map(observables, o => false);
        let subscription = new Subscription();

        _.forEach(observables, (observable, i) => {
            subscription.add(observable.subscribe(event => {
                buffers[i].push(event);
                loop(buffers, completed, observer);
            }, error => {
                observer.error(error);
            }, () => {
                completed[i] = true;
                if (_.every(completed, completion => completion)) {
                    flushBuffer(buffers, observer);
                    observer.complete();
                } else {
                    loop(buffers, completed, observer);
                }
            }));
        });

        return subscription;
    });
}

function loop(buffers: Event[][], completed: boolean[], observer: Observer<Event>) {
    while (observablesHaveEmitted(buffers, completed)) {
        let item = getLowestItem(buffers);
        if (item) observer.next(item);
    }
}

function flushBuffer(buffers: Event[][], observer: Observer<Event>) {
    let item = null;
    do {
        item = getLowestItem(buffers);
        if (item) observer.next(item);
    } while (item);
}

function observablesHaveEmitted(buffers: Event[][], completed: boolean[]): boolean {
    return _.every(buffers, (buffer, i) => completed[i] || buffer.length);
}

function getLowestItem(buffers: Event[][]): Event {
    let lowestItems = peekLowestItems(buffers);
    if (!lowestItems.length) {
        return null;
    }
    let min = _.minBy(lowestItems, item => !item.event.timestamp ? 0 : item.event.timestamp);
    return buffers[min.index].shift();
}

function peekLowestItems(buffers: Event[][]) {
    return _(buffers).map((buffer, i) => {
        return buffer[0] ? {event: buffer[0], index: i} : null;
    }).compact().valueOf();
}