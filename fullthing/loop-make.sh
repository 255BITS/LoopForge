#!/bin/bash

MODEL="${MODEL:-claude-opus-4-5-20251101:thinking}"

gptdiff "Implement an initial version of the DESIGN" --apply --verbose --model "$MODEL"

git add .
git commit -m 'initial'
git push

for i in {1..10}; do
  gptdiff "Improve the DESIGN in a specific dimension that will help achieve the PLAN" --apply --verbose --model "$MODEL"
  git add .
  git commit -m 'update'
  git push
done
