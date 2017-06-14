import * as moment from "moment";
import {injectable, inject} from "inversify";
import {IDateRetriever} from "prettygoat";

export type BucketForManifest = {
    entityBucket: string;
    manifestBuckets: string[];
}

@injectable()
export class TimePartitioner {

    constructor(@inject("IDateRetriever") private dateRetriever: IDateRetriever) {

    }

    bucketsFrom(date: Date): BucketForManifest[] {
        let buckets: string[] = [];

        while (this.dateRetriever.getDate() >= date) {
            buckets.push(moment(date).format("YYYYMMDD"));
            date = moment(date).add(1, "days").hour(0).second(0).minute(0).toDate();
        }
        return buckets;
    }
}