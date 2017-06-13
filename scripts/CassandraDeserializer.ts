import {injectable} from "inversify";
import {Event, IEventDeserializer} from "prettygoat";

@injectable()
class CassandraDeserializer implements IEventDeserializer {

    toEvent(row): Event {
        return {
            type: row.manifest,
            payload: JSON.parse(row.payload),
            timestamp: row.timestamp,
            splitKey: null
        };
    }
}

export default CassandraDeserializer
