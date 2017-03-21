import {injectable} from "inversify";
import {IWhen, Matcher, Identity} from "prettygoat";
import * as _ from "lodash";
import IEventsFilter from "./IEventsFilter";

@injectable()
class EventsFilter implements IEventsFilter {

    private events: string[] = [];

    filter(definition: IWhen<any>): string[] {
        let eventsList: string[];
        if (definition.$any) {
            eventsList = this.events;
        } else {
            let matcher = new Matcher(definition);
            eventsList = _(this.events).map(event => {
                return matcher.match(event) !== Identity ? event : null;
            }).compact().valueOf();
        }
        return eventsList;
    }

    setEventsList(events: string[]) {
        this.events = events;
    }
}

export default EventsFilter