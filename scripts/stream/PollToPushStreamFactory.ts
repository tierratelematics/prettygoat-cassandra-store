import {IStreamFactory, Event, IWhen} from "prettygoat";
import {injectable, inject, optional} from "inversify";
import {Observable} from "rx";
import {DefaultPollToPushConfig, IPollToPushConfig} from "../config/PollToPushConfig";

@injectable()
class PollToPushStreamFactory implements IStreamFactory {

    constructor(@inject("StreamFactory") private streamFactory: IStreamFactory,
                @inject("IPollToPushConfig") @optional() private config: IPollToPushConfig = new DefaultPollToPushConfig()) {

    }

    from(lastEvent: Date, completions?: Observable<string>, definition?: IWhen<any>): Observable<Event> {
        return this.streamFactory
            .from(lastEvent, completions, definition)
            .concat(Observable.just({
                type: "__prettygoat_internal_realtime",
                payload: null,
                timestamp: null,
                splitKey: null
            }))
            .concat(
                Observable
                    .interval(this.config.interval)
                    .flatMap(_ => this.streamFactory.from(lastEvent, completions, definition)))
            .do(event => {
                if (event.timestamp)
                    lastEvent = event.timestamp;
            });
    }
}

export default PollToPushStreamFactory
