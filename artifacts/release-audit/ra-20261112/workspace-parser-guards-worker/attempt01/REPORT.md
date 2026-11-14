# Initial focused run: RED preserved

Normal allowed JSON/exact scope and all nine rejection cases passed. The duplicate-map test expected 200 but received 422. Go encoding/json reuses a decoded map across duplicate object-valued fields: the first unsafe preference key survives the second object and is rejected by production Validate. This is a test expectation error, not evidence of a product bypass. Valid import assertions later in that test were not reached. No product source was changed. No retry has run.

The runtime source hashes and test source are unchanged during execution. Outer wall 2.964s; package 0.759s. Owned process group empty afterward.
