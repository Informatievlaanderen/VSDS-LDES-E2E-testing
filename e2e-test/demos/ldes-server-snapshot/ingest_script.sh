for member in {1..11} ; do
    curl -i -X POST \
      --url 'http://localhost:8080/mobility-hindrances' \
      -H "Content-Type: text/turtle" \
      --data-binary "@./data/small/member$member.ttl"
done

#for member in {1..726} ; do
#    curl -i -X POST \
#      --url 'http://localhost:8080/mobility-hindrances' \
#      -H "Content-Type: text/turtle" \
#      --data-binary "@./data/medium/member$member.ttl"
#done
