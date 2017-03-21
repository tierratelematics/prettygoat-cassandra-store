import {IWhen} from "prettygoat";

interface IEventsFilter {
    filter(definition:IWhen<any>):string[];
    setEventsList(events:string[]);
}

export default IEventsFilter