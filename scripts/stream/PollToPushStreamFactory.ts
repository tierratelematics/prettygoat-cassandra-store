import {IStreamFactory, Event, IWhen, IDateRetriever} from "prettygoat";
import {injectable, inject, optional} from "inversify";
import {Observable} from "rx";
import {DefaultPollToPushConfig, IPollToPushConfig} from "../config/PollToPushConfig";

@injectable()
class PollToPushStreamFactory implements IStreamFactory {

    constructor(@inject("StreamFactory") private streamFactory: IStreamFactory,
                @inject("IPollToPushConfig") @optional() private config: IPollToPushConfig = new DefaultPollToPushConfig(),
                @inject("IDateRetriever") private dateRetriever: IDateRetriever) {

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
            .concat(Observable
                .interval(this.config.interval)
                .flatMapWithMaxConcurrent(1, _ => this.streamFactory.from(lastEvent, completions, definition))
            )
            .do(_ => lastEvent = this.dateRetriever.getDate());
    }
}

export default PollToPushStreamFactory
