#!/bin/bash
docker build -t ghcr.io/linjonh/nextjs-gallery:latest .

docker run -d -p 3000:3000 ghcr.io/linjonh/nextjs-gallery:latest