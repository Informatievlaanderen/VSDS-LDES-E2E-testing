# TODO

```bash
clear
docker compose up -d --wait
./server/seed.sh
./server/seed.time-based.sh
docker compose up -d --wait message-generator
```

```bash
docker compose rm --stop --force message-generator
docker compose down
```
