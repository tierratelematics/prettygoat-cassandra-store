import {Projection, IProjection, IProjectionDefinition} from "prettygoat";

@Projection("Mock")
class MockProjectionDefinition implements IProjectionDefinition<number> {

    constructor() {

    }

    define():IProjection<number> {
        return {
            name: "test",
            definition: {
                $init: () => 10,
                TestEvent: (s, e:number) => s + e
            }
        };
    }

}

export default MockProjectionDefinition