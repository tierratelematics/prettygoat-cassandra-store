import {IStreamFactory, Event, IWhen, IDateRetriever} from "prettygoat";
import {injectable, inject, optional} from "inversify";
import {Observable} from "rx";
import {DefaultPollToPushConfig, IPollToPushConfig} from "../config/PollToPushConfig";

const REALTIME = "__prettygoat_internal_realtime";

@injectable()
class PollToPushStreamFactory implements IStreamFactory {

    constructor(@inject("StreamFactory") private streamFactory: IStreamFactory,
                @inject("IPollToPushConfig") @optional() private config: IPollToPushConfig = new DefaultPollToPushConfig()) {

    }

    from(lastEvent: Date, completions?: Observable<string>, definition?: IWhen<any>): Observable<Event> {
        return this.streamFactory
            .from(lastEvent, completions, definition)
            .concat(Observable.just(this.eventWithManifest(REALTIME)))
            .concat(Observable
                .interval(this.config.interval)
                .flatMapWithMaxConcurrent(1, _ => this.streamFactory.from(lastEvent, completions, definition))
            )
            .do(event => {
                if (event.timestamp)
                    lastEvent = event.timestamp;
            });
    }

    private eventWithManifest(manifest: string): Event {
        return {
            type: manifest,
            payload: null,
            timestamp: null,
            splitKey: null
        };
    }
}

export default PollToPushStreamFactory
