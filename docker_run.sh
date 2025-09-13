#!/bin/bash
sudo docker build -t ghcr.io/linjonh/nextjs-gallery:latest .

sudo docker stop gallery
sudo docker rm gallery
sudo docker run -d -p 3020:3000 --name gallery ghcr.io/linjonh/nextjs-gallery:latest