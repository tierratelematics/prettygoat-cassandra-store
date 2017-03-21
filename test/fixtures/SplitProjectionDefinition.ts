import {Projection, IProjection, IProjectionDefinition} from "prettygoat";

@Projection("Split")
class SplitProjectionDefinition implements IProjectionDefinition<number> {

    define():IProjection<number> {
        return {
            name: "split",
            definition: {
                $init: () => 10,
                TestEvent: (s, e:any) => s + e.count,
                LinkedState: (s, e:{ count2:number }) => s + e.count2,
                split: (s, e:any) => s + e,
            },
            split: {
                TestEvent: (e:any) => e.id.toString()
            }
        };
    }

}

export default SplitProjectionDefinition