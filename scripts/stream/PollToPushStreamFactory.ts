import {IStreamFactory, Event, WhenBlock, IDateRetriever, SpecialEvents} from "prettygoat";
import {injectable, inject, optional} from "inversify";
import {Observable} from "rxjs";
import {DefaultPollToPushConfig, IPollToPushConfig} from "../config/PollToPushConfig";

const EMPTY_POLLING = "__prettygoat_internal_empty_poll";

@injectable()
class PollToPushStreamFactory implements IStreamFactory {

    constructor(@inject("StreamFactory") private streamFactory: IStreamFactory,
                @inject("IPollToPushConfig") @optional() private config: IPollToPushConfig = new DefaultPollToPushConfig(),
                @inject("IDateRetriever") private dateRetriever: IDateRetriever) {

    }

    from(lastEvent: Date, completions?: Observable<string>, definition?: WhenBlock<any>): Observable<Event> {
        let pollTime = this.dateRetriever.getDate();
        return this.streamFactory
            .from(lastEvent, completions, definition)
            .concat(Observable.of(this.eventWithManifest(SpecialEvents.REALTIME)))
            .concat(Observable
                .interval(this.config.interval)
                .do(() => pollTime = this.dateRetriever.getDate())
                .flatMap(_ => this.streamFactory
                    .from(lastEvent, completions, definition)
                    .defaultIfEmpty(this.eventWithManifest(EMPTY_POLLING)), 1)
            )
            .do(event => {
                if (event.timestamp)
                    lastEvent = event.timestamp;
                // Move forward the poll time if some buckets can be skipped in the next iteration (in order to avoid stressing cassandra)
                // since I'm in realtime (and no more events are produced in the past) or an empty poll cycle
                // has been done
                if ((event.type === SpecialEvents.REALTIME || event.type === EMPTY_POLLING) && pollTime > lastEvent)
                    lastEvent = pollTime;
            })
            .filter(event => event.type !== EMPTY_POLLING);
    }

    private eventWithManifest(manifest: string): Event {
        return {
            type: manifest,
            payload: null,
            timestamp: null
        };
    }
}

export default PollToPushStreamFactory
