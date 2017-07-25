import {ICassandraClient, IQuery} from "./ICassandraClient";
import {Observable} from "rxjs";
import {inject, injectable} from "inversify";
import {Client, auth} from "cassandra-driver";
import {assign} from "lodash";
import ICassandraConfig from "./config/ICassandraConfig";
import {SpecialEvents} from "prettygoat";

@injectable()
class CassandraClient implements ICassandraClient {
    private client: any;

    constructor(@inject("ICassandraConfig") private config: ICassandraConfig) {
        let authProvider: auth.AuthProvider;
        if (config.username && config.password) {
            authProvider = new auth.PlainTextAuthProvider(config.username, config.password);
        }
        this.client = new Client(assign({
            contactPoints: config.hosts,
            keyspace: config.keyspace,
            authProvider: authProvider
        }, config.driverOptions || {}));
    }

    execute(query: IQuery): Observable<any> {
        return Observable.from(this.client.execute(query[0], query[1], {prepare: !!query[1]})).map<any, any>(result => result.rows);
    }

    paginate(query: IQuery, completions: Observable<string>): Observable<any> {
        let manifest = query[1].manifest;

        return Observable.create(observer => {
            let resultPage = null,
                subscription = completions
                    .filter(completion => completion === manifest)
                    .filter(completion => resultPage && resultPage.nextPage)
                    .subscribe(completion => resultPage.nextPage());

            this.client.eachRow(query[0], query[1], {prepare: !!query[1], fetchSize: this.config.fetchSize || 5000},
                (n, row) => observer.next(row),
                (error, result) => {
                    if (error) observer.error(error);
                    else if (result.nextPage) {
                        resultPage = result;
                        observer.next({
                            manifest: SpecialEvents.FETCH_EVENTS,
                            payload: JSON.stringify({
                                payload: {event: manifest}
                            }),
                            timestamp: null
                        });
                    } else {
                        observer.complete();
                        subscription.unsubscribe();
                    }
                }
            );
            return subscription;
        });
    }

}

export default CassandraClient
