#!/bin/sh
view_template=$(<./config/view-combined.ttl)
view=${view_template/CURRENTTIME/"$(date -u -d "1 minutes" +"%Y-%m-%dT%H:%M:%S")"}
curl -i -X POST \
  --url 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' \
  -H "Content-Type: text/turtle" \
  --data-raw "$view"
