# AppMonitoring — Frontend

![Frontend CI](https://github.com/eya-bj/app-monitoring-frontend/actions/workflows/ci.yml/badge.svg?branch=sprint-3)

## Build
```bash
npm install --legacy-peer-deps
npm run build -- --configuration production
```

## Production image
```bash
docker build -t appmonitoring-frontend:prod .
```
