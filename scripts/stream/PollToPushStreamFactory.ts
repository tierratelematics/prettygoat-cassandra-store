import {IStreamFactory, Event, WhenBlock, SpecialEvents} from "prettygoat";
import {injectable, inject, optional} from "inversify";
import {Observable} from "rxjs";
import {DefaultPollToPushConfig, IPollToPushConfig} from "../config/PollToPushConfig";

@injectable()
class PollToPushStreamFactory implements IStreamFactory {

    constructor(@inject("StreamFactory") private streamFactory: IStreamFactory,
                @inject("IPollToPushConfig") @optional() private config: IPollToPushConfig = new DefaultPollToPushConfig()) {

    }

    from(lastEvent: Date, completions?: Observable<string>, definition?: WhenBlock<any>): Observable<Event> {
        return this.streamFactory
            .from(lastEvent, completions, definition)
            .concat(Observable.of(this.eventWithManifest(SpecialEvents.REALTIME)))
            .concat(Observable
                .interval(this.config.interval)
                .flatMap(_ => this.streamFactory.from(lastEvent, completions, definition), 1)
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
            timestamp: null
        };
    }
}

export default PollToPushStreamFactory
