# Prettygoat-cassandra-store

Cassandra as event store for [prettygoat](https://github.com/tierratelematics/prettygoat).

## Installation

`
$ npm install prettygoat-cassandra-store
`

Add this code to the boostrapper.

```typescript
import {CassandraModule} from "prettygoat-cassandra-store";

engine.register(new CassandraModule());
```

Add an endpoint for cassandra in a module.

```typescript
import {ICassandraConfig} from "prettygoat-cassandra-store";

container.bind<ICassandraConfig>("ICassandraConfig").toConstantValue({ 
    hosts: ["your_host"],
    keyspace: "your_keyspace"
});
```

You're up!

## License

Copyright 2016 Tierra SpA

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
