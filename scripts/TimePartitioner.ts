import * as moment from "moment";
import {injectable, inject} from "inversify";
import {IDateRetriever} from "prettygoat";

export type Bucket = {
    entity: string;
    manifest: string;
}

@injectable()
export class TimePartitioner {

    constructor(@inject("IDateRetriever") private dateRetriever: IDateRetriever) {

    }

    bucketsFrom(date: Date): Bucket[] {
        let buckets: Bucket[] = [];

        while (this.dateRetriever.getDate() >= date) {
            let momentDate = moment.utc(date).second(0).minute(0);
            buckets.push({
                entity: momentDate.format("YYYY0000T000000") + "Z",
                manifest: momentDate.format("YYYYMMDDTHHmmss") + "Z"
            });
            date = momentDate.add(1, "hours").toDate();
        }
        return buckets;
    }
}
