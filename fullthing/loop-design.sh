#!/bin/bash

MODEL="${MODEL:-claude-opus-4-5-20251101:thinking}"

for i in {1..5}; do
  gptdiff "Create a DESIGN-candidate-${i}.txt that describes a different potential solution to the PLAN. Be specific in regards to distribution and how we get there." --apply --verbose --model "$MODEL"
done

gptdiff "Choose the best DESIGN-candidate and output it to DESIGN. Add a RATIONALE section that explains the path and why its the best." DESIGN-candidate-* --apply --verbose --model "$MODEL"

mkdir -p oldcandidates

mv DESIGN-candidate-* oldcandidates

