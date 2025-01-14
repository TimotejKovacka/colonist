# Redis Connection

## Docker Environment

If your service runs in Docker and is on the `app-network`:

```
Host: redis
Port: 6379
```

## Local Development

If you're running the service locally:

```
Host: 127.0.0.1
Port: 6379
```

## Connection URL Format

```
redis://127.0.0.1:6379    # Local development
redis://redis:6379        # Docker environment
```

No credentials required for local development setup.
