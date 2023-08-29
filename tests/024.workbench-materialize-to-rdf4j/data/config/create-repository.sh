curl -X POST --location "http://localhost:8080/rdf4j-workbench/repositories/NONE/create" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "type=memory&Repository+ID=test&Repository+title=Memory+store&Persist=true&Sync+delay=0&Query+Evaluation+Mode=STANDARD"