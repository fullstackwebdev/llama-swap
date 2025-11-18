#!/bin/bash

docker run -it --rm \
  --runtime=nvidia \
  --gpus all \
  -p 8080:8080 \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/models:/models \
  llama-swap-node:latest