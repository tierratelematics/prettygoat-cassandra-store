import {Observable} from "rxjs";

export interface ICassandraClient {
    execute(query: IQuery): Observable<any>;
    paginate(query: IQuery, completions: Observable<string>): Observable<any>;
}

export type IQuery = [string, any]