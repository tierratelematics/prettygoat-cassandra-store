import {injectable} from "inversify";
import {Event, IEventDeserializer} from "prettygoat";

@injectable()
class CassandraDeserializer implements IEventDeserializer {

    toEvent(row): Event {
        let parsedEvent = JSON.parse(row.event);

        return {
            type: parsedEvent.payload.$manifest,
            payload: parsedEvent.payload,
            timestamp: row.timestamp.getDate(),
            splitKey: null
        };
    }
}

export default CassandraDeserializer;
